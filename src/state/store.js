import { createContext, useReducer } from 'react';

export const DrawingContext = createContext();
export const SettingsContext = createContext();

const initialState = {
  points: [],
  settings: { color: '#000', size: 2 },
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_POINT':
      return { ...state, points: [...state.points, action.payload] };
    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    default:
      return state;
  }
}

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <DrawingContext.Provider value={{ points: state.points, dispatch }}>
      <SettingsContext.Provider value={state.settings}>
        {children}
      </SettingsContext.Provider>
    </DrawingContext.Provider>
  );
};