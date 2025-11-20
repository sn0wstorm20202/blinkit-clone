import { ActionResult, VoiceAgentResponse, ProductSearchResult } from './types';
import { findRecipe } from './recipes';

export class ActionDispatcher {
  private router: any;
  private token: string | null;

  constructor(router: any) {
    this.router = router;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
  }

  async dispatch(response: VoiceAgentResponse): Promise<ActionResult> {
    const { action, params } = response;

    try {
      // always refresh token in case it has changed
      if (typeof window !== 'undefined') {
        this.token = localStorage.getItem('bearer_token');
      }

      switch (action) {
        case 'search_and_add':
          return await this.searchAndAdd(params);
        
        case 'add_to_cart':
          return await this.addToCart(params);
        
        case 'remove_item':
          return await this.removeItem(params);
        
        case 'update_quantity':
          return await this.updateQuantity(params);
        
        case 'navigate':
          return this.navigate(params);
        
        case 'search_products':
          return await this.searchProducts(params);
        
        case 'checkout':
          return this.checkout();
        
        case 'add_recipe_ingredients':
          return await this.addRecipeIngredients(params);
        
        case 'get_cart':
          return await this.getCart();
        
        case 'clear_cart':
          return await this.clearCart();

        case 'create_address':
          return await this.createAddress(params);

        case 'update_address':
          return await this.updateAddress(params);

        case 'set_default_address':
          return await this.setDefaultAddress(params);
        
        case 'ask':
        case 'confirm':
        case 'fallback':
          return { success: true, message: response.response };
        
        default:
          return { success: false, message: 'Unknown action', error: 'UNKNOWN_ACTION' };
      }
    } catch (error) {
      console.error('Action dispatch error:', error);
      return {
        success: false,
        message: 'Failed to execute action',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async searchAndAdd(params: any): Promise<ActionResult> {
    const p = params || {};

    // Multi-item support: items: [{ query, quantity? }] or queries: string[]
    const itemsParam = Array.isArray(p.items) ? p.items : null;
    const queriesParam = !itemsParam && Array.isArray(p.queries) ? p.queries : null;

    if (itemsParam || queriesParam) {
      const items = (itemsParam || queriesParam.map((q: any) => ({ query: q }))) as Array<{ query: string; quantity?: number }>;

      const addedNames: string[] = [];
      const failedNames: string[] = [];

      for (const item of items) {
        const q = String(item.query || '').trim();
        if (!q) continue;

        const search = await this.searchProducts({ query: q });
        if (!search.success || !search.data || search.data.length === 0) {
          failedNames.push(q);
          continue;
        }

        const all: ProductSearchResult[] = search.data;
        const exact = all.find(p => p.name.toLowerCase() === q.toLowerCase()) || all[0];

        const addRes = await this.addToCart({ product_id: exact.id, quantity: item.quantity ?? 1 });
        if (addRes.success) {
          addedNames.push(exact.name);
        } else {
          failedNames.push(q);
        }
      }

      if (addedNames.length === 0) {
        return {
          success: false,
          message: 'Could not add any of the requested items to your cart',
          error: 'NO_ITEMS_ADDED',
        };
      }

      const message = failedNames.length
        ? `Added ${addedNames.length} item(s) to your cart. Could not add: ${failedNames.join(', ')}`
        : `Added ${addedNames.length} item(s) to your cart`;

      return {
        success: true,
        message,
        data: { added: addedNames, failed: failedNames },
      };
    }

    const { query, quantity = 1 } = p;
    if (!query || String(query).trim().length === 0) {
      return { success: false, message: 'Search term required', error: 'MISSING_QUERY' };
    }

    const search = await this.searchProducts({ query });
    if (!search.success || !search.data || search.data.length === 0) {
      return { success: false, message: `No products found for "${query}"`, error: 'NO_RESULTS' };
    }

    const all: ProductSearchResult[] = search.data;
    const exact = all.find(p => p.name.toLowerCase() === String(query).toLowerCase()) || all[0];

    return await this.addToCart({ product_id: exact.id, quantity });
  }

  private async addToCart(params: any): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }

    const { product_id, product_name, quantity = 1 } = params;

    if (!product_id) {
      if (product_name) {
        const search = await this.searchProducts({ query: product_name });
        if (!search.success || !search.data || search.data.length === 0) {
          return { success: false, message: `No products found for "${product_name}"`, error: 'NO_RESULTS' };
        }
        const product: ProductSearchResult = (search.data as ProductSearchResult[])[0];
        return this.addToCart({ product_id: product.id, quantity });
      }
      return { success: false, message: 'Product not specified', error: 'MISSING_PRODUCT' };
    }

    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ product_id, quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.error || 'Failed to add item', error: error.code };
      }

      const data = await response.json();
      window.dispatchEvent(new Event('cartUpdated'));
      
      return { 
        success: true, 
        message: `Added ${quantity} item(s) to cart`,
        data 
      };
    } catch (error) {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }

  private async removeItem(params: any): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }

    const p = params || {};
    let { cart_item_id } = p;
    const searchName =
      p.product_name ??
      p.product ??
      p.name ??
      p.item_name ??
      p.productName ??
      p.itemName ??
      null;

    if (!cart_item_id) {
      if (searchName) {
        try {
          const cart = await this.getCart();
          if (cart.success && cart.data?.items?.length) {
            const match = cart.data.items.find((it: any) =>
              String(it.product?.name || '')
                .toLowerCase()
                .includes(String(searchName).toLowerCase())
            );
            if (match) {
              cart_item_id = match.id;
            }
          }
        } catch {}
      }
      if (!cart_item_id) {
        return { success: false, message: 'Item not specified', error: 'MISSING_ITEM_ID' };
      }
    }

    try {
      const response = await fetch(`/api/cart/items/${cart_item_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.error || 'Failed to remove item', error: error.code };
      }

      window.dispatchEvent(new Event('cartUpdated'));
      return { success: true, message: 'Item removed from cart' };
    } catch (error) {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }

  private async updateQuantity(params: any): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }

    const p = params || {};
    let { cart_item_id, quantity } = p;
    const searchName =
      p.product_name ??
      p.product ??
      p.name ??
      p.item_name ??
      p.productName ??
      p.itemName ??
      null;

    if (!cart_item_id) {
      if (searchName) {
        try {
          const cart = await this.getCart();
          if (cart.success && cart.data?.items?.length) {
            const match = cart.data.items.find((it: any) =>
              String(it.product?.name || '')
                .toLowerCase()
                .includes(String(searchName).toLowerCase())
            );
            if (match) {
              cart_item_id = match.id;
            }
          }
        } catch {}
      }
    }

    if (!cart_item_id || !quantity) {
      return { success: false, message: 'Missing required parameters', error: 'MISSING_PARAMS' };
    }

    try {
      const response = await fetch(`/api/cart/items/${cart_item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.error || 'Failed to update quantity', error: error.code };
      }

      window.dispatchEvent(new Event('cartUpdated'));
      return { success: true, message: `Updated quantity to ${quantity}` };
    } catch (error) {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }

  private navigate(params: any): ActionResult {
    const { target } = params;

    const routeMap: Record<string, string> = {
      home: '/',
      cart: '/', // Opens cart sidebar
      checkout: '/checkout',
      orders: '/orders',
      profile: '/profile',
      categories: '/',
      products: '/',
    };

    const lower = String(target || '').toLowerCase();
    if (lower === 'back' || lower === 'go back' || lower === 'previous') {
      if (this.router?.back) {
        this.router.back();
        return { success: true, message: 'Going back' };
      }
    }

    const route = routeMap[lower] || target;

    if (lower === 'cart') {
      try {
        if (typeof window !== 'undefined') {
          const isHome = window.location.pathname === '/';

          if (isHome) {
            window.dispatchEvent(new CustomEvent('openCart'));
          } else {
            try { localStorage.setItem('openCartOnLoad', '1'); } catch {}
            if (this.router) this.router.push('/');
          }
        }
      } catch {}

      return { success: true, message: 'Opening cart' };
    }

    if (route && this.router) {
      this.router.push(route);
      return { success: true, message: `Navigating to ${target}` };
    }

    return { success: false, message: 'Invalid navigation target', error: 'INVALID_TARGET' };
  }

  private async searchProducts(params: any): Promise<ActionResult> {
    const { query, category } = params;

    if (!query && !category) {
      return { success: false, message: 'Search query required', error: 'MISSING_QUERY' };
    }

    try {
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('search', query);
      if (category) searchParams.append('category_name', category);

      const response = await fetch(`/api/products?${searchParams.toString()}`);

      if (!response.ok) {
        return { success: false, message: 'Search failed', error: 'SEARCH_ERROR' };
      }

      const products: ProductSearchResult[] = await response.json();
      
      return { 
        success: true, 
        message: `Found ${products.length} product(s)`,
        data: products 
      };
    } catch (error) {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }

  private checkout(): ActionResult {
    if (!this.token) {
      return { success: false, message: 'Please login to checkout', error: 'UNAUTHORIZED' };
    }

    if (this.router) {
      this.router.push('/checkout');
      return { success: true, message: 'Proceeding to checkout' };
    }

    return { success: false, message: 'Navigation error', error: 'NO_ROUTER' };
  }

  private async addRecipeIngredients(params: any): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }

    const { recipe_name } = params;

    if (!recipe_name) {
      return { success: false, message: 'Recipe name required', error: 'MISSING_RECIPE_NAME' };
    }

    // Find recipe
    const recipe = findRecipe(recipe_name);
    
    if (!recipe) {
      return { success: false, message: `Recipe "${recipe_name}" not found`, error: 'RECIPE_NOT_FOUND' };
    }

    const addedItems: string[] = [];
    const failedItems: string[] = [];

    // Search and add each ingredient
    for (const ingredient of recipe.ingredients) {
      const searchTerms = [ingredient.product_name, ...(ingredient.alternatives || [])];
      
      let productAdded = false;
      
      for (const term of searchTerms) {
        try {
          const searchResult = await this.searchProducts({ query: term });
          
          if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
            const product = searchResult.data[0]; // Use first match
            
            const addResult = await this.addToCart({ 
              product_id: product.id, 
              quantity: 1 
            });
            
            if (addResult.success) {
              addedItems.push(product.name);
              productAdded = true;
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!productAdded) {
        failedItems.push(ingredient.product_name);
      }
    }

    if (addedItems.length === 0) {
      return { 
        success: false, 
        message: `Could not find ingredients for ${recipe.name}`,
        error: 'NO_INGREDIENTS_FOUND' 
      };
    }

    const message = failedItems.length > 0
      ? `Added ${addedItems.length} ingredients for ${recipe.name}. Could not find: ${failedItems.join(', ')}`
      : `Added all ${addedItems.length} ingredients for ${recipe.name}`;

    return { 
      success: true, 
      message,
      data: { addedItems, failedItems } 
    };
  }

  private async getCart(): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }

    try {
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return { success: false, message: 'Failed to fetch cart', error: 'CART_FETCH_ERROR' };
      }

      const cart = await response.json();
      return { success: true, message: 'Cart fetched', data: cart };
    } catch (error) {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }

  private async clearCart(): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return { success: false, message: 'Failed to clear cart', error: 'CLEAR_CART_ERROR' };
      }

      window.dispatchEvent(new Event('cartUpdated'));
      return { success: true, message: 'Cart cleared' };
    } catch (error) {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }

  private normalizeAddressParams(params: any) {
    const p = params || {};
    return {
      full_name: p.full_name ?? p.fullName ?? p.name ?? '',
      phone_number: p.phone_number ?? p.phoneNumber ?? p.phone ?? '',
      address_line1: p.address_line1 ?? p.addressLine1 ?? p.line1 ?? '',
      address_line2: p.address_line2 ?? p.addressLine2 ?? p.line2 ?? null,
      city: p.city ?? '',
      state: p.state ?? '',
      postal_code: p.postal_code ?? p.postalCode ?? p.pincode ?? '',
      is_default: p.is_default ?? p.isDefault ?? false,
    };
  }

  private async createAddress(params: any): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }

    const body = this.normalizeAddressParams(params);
    // basic validation
    const required = ['full_name','phone_number','address_line1','city','state','postal_code'] as const;
    const missing = required.filter(k => !body[k] || String(body[k]).trim() === '');
    if (missing.length) {
      return { success: false, message: 'Missing address details', error: 'MISSING_FIELDS' };
    }

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, message: err.error || 'Failed to create address', error: err.code || 'ADDR_CREATE_FAILED' };
      }
      const data = await res.json();
      return { success: true, message: 'Address saved', data };
    } catch {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }

  private async updateAddress(params: any): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }
    const id = params?.id ?? params?.address_id;
    if (!id) {
      return { success: false, message: 'Address ID required', error: 'MISSING_ID' };
    }
    const body = this.normalizeAddressParams(params);
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, message: err.error || 'Failed to update address', error: err.code || 'ADDR_UPDATE_FAILED' };
      }
      const data = await res.json();
      return { success: true, message: 'Address updated', data };
    } catch {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }

  private async setDefaultAddress(params: any): Promise<ActionResult> {
    if (!this.token) {
      return { success: false, message: 'Please login first', error: 'UNAUTHORIZED' };
    }
    const id = params?.id ?? params?.address_id;
    if (!id) {
      return { success: false, message: 'Address ID required', error: 'MISSING_ID' };
    }
    try {
      const res = await fetch(`/api/addresses/${id}/set-default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, message: err.error || 'Failed to set default address', error: err.code || 'ADDR_SET_DEFAULT_FAILED' };
      }
      const data = await res.json();
      return { success: true, message: 'Default address set', data };
    } catch {
      return { success: false, message: 'Network error', error: 'NETWORK_ERROR' };
    }
  }
}
