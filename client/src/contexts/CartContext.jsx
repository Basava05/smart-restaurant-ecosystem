import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.menuItemId === action.payload.menuItemId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menuItemId === action.payload.menuItemId
              ? { ...i, qty: i.qty + 1 }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, qty: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.menuItemId !== action.payload),
      };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.menuItemId === action.payload.menuItemId
              ? { ...i, qty: action.payload.qty }
              : i
          )
          .filter((i) => i.qty > 0),
      };
    case 'SET_RESTAURANT':
      return { ...state, restaurantId: action.payload, items: [] };
    case 'CLEAR':
      return { restaurantId: null, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, dispatch] = useReducer(cartReducer, {
    restaurantId: null,
    items: [],
  });

  // Automatically clear cart when user logs out
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'CLEAR' });
    }
  }, [user]);

  const addItem = useCallback(
    (item) => {
      // If switching restaurants, clear old cart first
      if (cart.restaurantId && cart.restaurantId !== item.restaurantId) {
        dispatch({ type: 'SET_RESTAURANT', payload: item.restaurantId });
      } else if (!cart.restaurantId) {
        dispatch({ type: 'SET_RESTAURANT', payload: item.restaurantId });
      }
      dispatch({ type: 'ADD_ITEM', payload: item });
    },
    [cart.restaurantId]
  );

  const removeItem = useCallback((menuItemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: menuItemId });
  }, []);

  const updateQty = useCallback((menuItemId, qty) => {
    dispatch({ type: 'UPDATE_QTY', payload: { menuItemId, qty } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const itemCount = cart.items.length;
  const totalPrice = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, updateQty, clearCart, itemCount, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
