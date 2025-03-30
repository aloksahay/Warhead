export type RootStackParamList = {
  Home: undefined;
  Dashboard: undefined;
  Game: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 