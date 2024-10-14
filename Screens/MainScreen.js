import React from 'react';
import { View, Text } from 'react-native';
import { useUser } from '../Context/UserContext';

const MainScreen = () => {

  const {user} = useUser();

  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
      <Text>Example Main Screen, You've logged in as {user.email}</Text>
    </View>
  );
};

export default MainScreen;
