import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../Context/UserContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // set user to context
  const {setUser} = useUser();

  // call firebase
  const auth = FIREBASE_AUTH;

  const navigation = useNavigation();

// user login
  const handleLogin = () => {
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        navigation.navigate('MainScreen')
        const user = userCredential.user;
        setUser(user)
      })
      .catch(error => Alert.alert('Login Error', error.message))
      .finally(() => setLoading(false));
  };


  // user register
  const handleRegister = () => {
    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        Alert.alert('Registration Successful', `Welcome, ${user.email}`);
      })
      .catch(error => Alert.alert('Registration Error', error.message))
      .finally(() => setLoading(false));
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Login or Register</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <Button title="Login" onPress={handleLogin} disabled={loading} />
      <View style={{margin:10}}></View>
      <Button title="Register" onPress={handleRegister} disabled={loading} />
    </View>
  );
};

export default LoginScreen;
