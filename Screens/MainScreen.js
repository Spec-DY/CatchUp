import React from 'react';
import { View, Text } from 'react-native';
import { useUser } from '../Context/UserContext';

const MainScreen = () => {

  const {user} = useUser();

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
      <Text>Example Main Screen, You've logged in{user.email}</Text>
    </View>
  );
};

export default MainScreen;
