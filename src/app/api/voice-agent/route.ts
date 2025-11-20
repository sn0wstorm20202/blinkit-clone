import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getUserFromRequest } from '@/lib/supabase/admin';
import { getAllRecipeNames } from '@/lib/voice/recipes';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting map (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = parseInt(process.env.VOICE_AGENT_RATE_LIMIT || '30');
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

const SYSTEM_PROMPT = `You are a helpful shopping assistant for an Indian grocery delivery app. You help users:
- Add items to cart by searching and adding automatically
- Remove items from cart
- Update quantities
- Navigate the app (home, cart, checkout, orders, categories)
- Add ingredients for recipes (you have access to: ${getAllRecipeNames().join(', ')})
- Answer questions about cart, orders, and products

You must ALWAYS respond with valid JSON in this exact format:
{
  "action": "<action_type>",
  "params": { <action_parameters> },
  "response": "<spoken_response_to_user>",
  "conversationState": {
    "state": "<conversation_state>",
    "context": { <optional_context> }
  },
  "confidence": <0.0_to_1.0>
}

Action types:
- search_and_add: Search for product and add to cart automatically. Params: { query: string, quantity?: number } OR { items: [{ query: string, quantity?: number }] } OR { queries: string[] }
- add_to_cart: Add a specific product by id or name. Params: { product_id?: string, product_name?: string, quantity?: number }
- remove_item: Remove an item from cart by cart_item_id or product name (fuzzy). Params: { cart_item_id?: string, product_name?: string }
- update_quantity: Update cart item quantity. Params: { cart_item_id?: string, product_name?: string, quantity: number }
- search_products: Search product catalog. Params: { query: string }
- add_recipe_ingredients: Add all recipe items. Params: { recipe_name: string }
- navigate: Go to page. Params: { target: "home"|"cart"|"checkout"|"orders"|"profile"|"back" }
- get_cart: Get cart contents. Params: {}
- checkout: Start checkout. Params: {}
- clear_cart: Remove all items from the user's cart. Params: {}
- create_address: Create a shipping address. Params: { full_name: string, phone_number: string, address_line1: string, address_line2?: string, city: string, state: string, postal_code: string, is_default?: boolean }
- update_address: Update an existing address. Params: { id: number, full_name?: string, phone_number?: string, address_line1?: string, address_line2?: string, city?: string, state?: string, postal_code?: string, is_default?: boolean }
- set_default_address: Set default address. Params: { id: number }
- fallback: When unclear. Params: { message: string }

Conversation states: idle, adding_items, confirming_cart, confirming_checkout

IMPORTANT RULES:
1. When user says "add milk", "add eggs", etc., use search_and_add action with the product name
2. For recipes, use add_recipe_ingredients with the recipe name
3. For navigation like "go to cart", "show cart", "open cart", use navigate with target="cart"
4. For "go to checkout", "checkout", use navigate with target="checkout"
5. For "go to profile", "my profile", use navigate with target="profile". For "go back" use navigate with target="back".
6. For address creation/update: if required fields are missing, use the 'ask' action to request exactly what's missing, in the user's language. When you have all fields, call create_address or update_address.
7. Use remove_item or update_quantity when the user asks to remove or change quantities for specific items.
8. For commands like "clear my cart", "empty the cart", "remove everything from the cart", use clear_cart.
9. When the user mentions multiple products in one sentence (e.g. "add bread and butter"), use search_and_add with an items array (one entry per product) and include quantities if specified.
10. Be conversational and helpful in your responses.
11. Respond in the same language the user speaks (English or Hindi).
12. Default quantity is 1 if not specified.

Examples:
User: "Add milk to cart"
Response: {"action":"search_and_add","params":{"query":"milk","quantity":1},"response":"Adding milk to your cart.","conversationState":{"state":"adding_items"},"confidence":0.9}

User: "Add 2 packets of eggs"
Response: {"action":"search_and_add","params":{"query":"eggs","quantity":2},"response":"Adding 2 packets of eggs to your cart.","conversationState":{"state":"adding_items"},"confidence":0.95}

User: "Add bread and butter to my cart"
Response: {"action":"search_and_add","params":{"items":[{"query":"bread"},{"query":"butter"}]},"response":"Adding bread and butter to your cart.","conversationState":{"state":"adding_items"},"confidence":0.95}

User: "Remove milk from cart"
Response: {"action":"remove_item","params":{"product_name":"milk"},"response":"Removing milk from your cart.","conversationState":{"state":"confirming_cart"},"confidence":0.9}

User: "Remove everything from my cart"
Response: {"action":"clear_cart","params":{},"response":"Clearing all items from your cart.","conversationState":{"state":"confirming_cart"},"confidence":0.95}

User: "Add ingredients for chicken biryani"
Response: {"action":"add_recipe_ingredients","params":{"recipe_name":"chicken biryani"},"response":"Adding all ingredients for chicken biryani to your cart.","conversationState":{"state":"adding_items"},"confidence":0.95}

User: "Go to checkout" OR "Show cart" OR "Open cart"
Response: {"action":"navigate","params":{"target":"cart"},"response":"Opening your cart.","conversationState":{"state":"idle"},"confidence":1.0}

User: "Go to checkout"
Response: {"action":"navigate","params":{"target":"checkout"},"response":"Taking you to checkout.","conversationState":{"state":"confirming_checkout"},"confidence":1.0}

User (Hindi): "दूध डालो"
Response: {"action":"search_and_add","params":{"query":"milk","quantity":1},"response":"दूध आपके कार्ट में जोड़ रहा हूं।","conversationState":{"state":"adding_items"},"confidence":0.9}

User (Bengali): "দুধ দাও"
Response: {"action":"search_and_add","params":{"query":"milk","quantity":1},"response":"দুধ কার্টে যোগ করছি।","conversationState":{"state":"adding_items"},"confidence":0.9}

User (Hindi): "मेरा पता जोड़ो: नाम रोहित, फोन 9876543210, पता लाइन 1 221B बेकर स्ट्रीट, शहर दिल्ली, राज्य दिल्ली, पिन 110001"
Response: {"action":"create_address","params":{"full_name":"Rohit","phone_number":"9876543210","address_line1":"221B Baker Street","city":"Delhi","state":"Delhi","postal_code":"110001","is_default":true},"response":"आपका पता सेव कर रहा हूं।","conversationState":{"state":"requesting_address"},"confidence":0.9}

User (Bengali): "ডিফল্ট ঠিকানা সেট করো"
Response: {"action":"ask","params":{},"response":"কোন ঠিকানাটি ডিফল্ট করতে চান? অনুগ্রহ করে ঠিকানার আইডি বলুন।","conversationState":{"state":"requesting_address"},"confidence":0.6}`;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { text, language = 'en-US', conversationState } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required', code: 'MISSING_TEXT' },
        { status: 400 }
      );
    }

    // Build conversation context
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history if present
    if (conversationState?.context?.history) {
      conversationState.context.history.slice(-3).forEach((entry: any) => {
        if (!entry) return;
        const userText = entry.userInput ?? '';
        const assistantRaw = entry.agentResponse ?? entry.response ?? '';
        const assistantText = String(assistantRaw);

        messages.push({ role: 'user', content: String(userText) });
        messages.push({ role: 'assistant', content: assistantText });
      });
    }

    // Add current user message with language context
    const languageName = language.startsWith('hi') ? 'Hindi' : 'English';
    let userContent = text;

    if (languageName === 'Hindi') {
      userContent = `The user is speaking Hindi. Understand the Hindi text and map any Hindi product or brand names into English product/catalog names in action params (like "milk", "eggs", "turmeric powder"). Always respond to the user in natural Hindi.\nUser: ${text}`;
    }

    messages.push({ 
      role: 'user', 
      content: userContent,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    const aiResponse = JSON.parse(responseText);

    // Validate response structure
    if (!aiResponse.action || !aiResponse.response) {
      throw new Error('Invalid AI response structure');
    }

    // Ensure conversationState exists
    if (!aiResponse.conversationState) {
      aiResponse.conversationState = {
        state: conversationState?.state || 'idle',
        context: conversationState?.context || {},
      };
    }

    // Log for debugging (anonymized)
    console.log('[Voice Agent]', {
      userId: user.id.substring(0, 8),
      action: aiResponse.action,
      language: languageName,
      confidence: aiResponse.confidence,
    });

    return NextResponse.json(aiResponse, { status: 200 });

  } catch (error) {
    console.error('Voice agent error:', error);
    
    // Return fallback response
    return NextResponse.json({
      action: 'fallback',
      params: { message: 'I encountered an error. Could you please repeat that?' },
      response: 'I encountered an error. Could you please repeat that?',
      conversationState: { state: 'idle' },
      confidence: 0.0,
    }, { status: 200 }); // Return 200 to avoid frontend errors
  }
}
