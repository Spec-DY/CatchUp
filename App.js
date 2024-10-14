import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './Screens/LoginScreen';
import MainScreen from './Screens/MainScreen';
import { UserProvider } from './Context/UserContext';

const Stack = createStackNavigator();

const App = () => {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LoginScreen">
          <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ title: 'Login' }} />
          <Stack.Screen name="MainScreen" component={MainScreen} options={{ title: 'Main' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

export default App;
