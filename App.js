import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Switch, FlatList, 
    SafeAreaView, Modal 
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Image } from 'react-native';


const App = () => {
    const [password, setPassword] = useState('');
    const [passwordLength, setPasswordLength] = useState('12');
    const [useSymbols, setUseSymbols] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useLowerCase, setUseLowerCase] = useState(true);
    const [useUpperCase, setUseUpperCase] = useState(true);
    const [generatedPasswords, setGeneratedPasswords] = useState([]);
    const [favoritePasswords, setFavoritePasswords] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [showGeneratedModal, setShowGeneratedModal] = useState(false);
    const [showFavoritesModal, setShowFavoritesModal] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    
    // Add state for biometric authentication result
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        // Check if biometric authentication is available
        LocalAuthentication.hasHardwareAsync().then((available) => {
            setBiometricAvailable(available);
        });
    }, []);

    // Function to authenticate user via biometric authentication
    const authenticateBiometrically = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Autentique-se para continuar',
                fallbackLabel: 'Usar senha',
            });

            if (result.success) {
                setIsLoggedIn(true);
            } else {
                alert('Falha na autenticação biométrica.');
            }
        } catch (error) {
            alert('Erro na autenticação biométrica.');
            console.error(error);
        }
    };

    const authenticateUser = async () => {
        try {
            const storedUsers = await AsyncStorage.getItem('users');
            const users = storedUsers ? JSON.parse(storedUsers) : [];
    
            const user = users.find(
                (u) => u.email === email.trim() && u.password === passwordInput
            );
    
            if (user) {
                setIsLoggedIn(true);
                alert('Login realizado com sucesso!');
            } else {
                alert('E-mail ou senha inválidos.');
            }
        } catch (error) {
            alert('Erro ao realizar login. Tente novamente.');
            console.error(error);
        }
    };
    
    const registerUser = async () => {
        if (!email.trim() || !passwordInput.trim()) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
    
        try {
            const storedUsers = await AsyncStorage.getItem('users');
            const users = storedUsers ? JSON.parse(storedUsers) : [];
    
            const userExists = users.some((u) => u.email === email.trim());
    
            if (userExists) {
                alert('Usuário já registrado com este e-mail.');
                return;
            }
    
            const newUser = { email: email.trim(), password: passwordInput.trim() };
            users.push(newUser);
    
            await AsyncStorage.setItem('users', JSON.stringify(users));
            alert('Cadastro realizado com sucesso! Agora você pode fazer login.');
            setEmail('');
            setPasswordInput('');
        } catch (error) {
            alert('Erro ao realizar cadastro. Tente novamente.');
            console.error(error);
        }
    };
    
    const logoutUser = async () => {
        setIsLoggedIn(false);
        setEmail('');
        setPasswordInput('');
        alert('Você foi deslogado com sucesso!');
    };
    

    // Função para gerar a senha
    const generatePassword = () => {
        let charset = '';
        let newPassword = '';

        if (useSymbols) charset += '!@#$%^&*()';
        if (useNumbers) charset += '0123456789';
        if (useLowerCase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (useUpperCase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let i = 0; i < parseInt(passwordLength); i++) {
            newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        setPassword(newPassword);
        setGeneratedPasswords([...generatedPasswords, newPassword]);
        setPasswordStrength(checkPasswordStrength(newPassword));
    };

    // Função para avaliar a força da senha
    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        if (strength === 5) return 'Muito Forte';
        if (strength === 4) return 'Forte';
        if (strength === 3) return 'Moderada';
        if (strength === 2) return 'Fraca';
        return 'Muito Fraca';
    };

    // Função para adicionar senha aos favoritos
    const addToFavorites = () => { 
        if (!favoritePasswords.includes(password) && password !== '') {
            setFavoritePasswords([...favoritePasswords, password]);
            alert('Senha favoritada!');
        } else {
            alert('Senha já está nos favoritos ou está vazia!');
        }
    };

    // Função para exportar as senhas favoritas
    const exportFavorites = async () => {
        if (favoritePasswords.length === 0) {
            alert('Nenhuma senha favorita para exportar.');
            return;
        }

        const filePath = `${FileSystem.cacheDirectory}favorite_passwords.txt`;
        const fileContent = favoritePasswords.join('\n'); 

        try {
            await FileSystem.writeAsStringAsync(filePath, fileContent);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath);
            } else {
                alert('O compartilhamento não está disponível no seu dispositivo.');
            }
        } catch (error) {
            alert('Erro ao exportar senhas favoritas.');
            console.error(error);
        }
    };

    const styles = getStyles(darkMode);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
        <Text style={styles.header}>Gerador de Senhas - HOW X</Text>
        <Text style={styles.subtitle}>Gustavo Henrique Kuhn</Text> 
        <Switch 
            value={darkMode} 
            onValueChange={() => setDarkMode(!darkMode)} 
        />
    </View>
    
            {!isLoggedIn ? (
                <View>
                    {biometricAvailable && (
                        <TouchableOpacity style={styles.button} onPress={authenticateBiometrically}>
                            <Text style={styles.buttonText}>Entrar com Biometria</Text>
                        </TouchableOpacity>
                    )}
                    <TextInput
                        placeholder="E-mail"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Senha"
                        value={passwordInput}
                        onChangeText={setPasswordInput}
                        secureTextEntry
                        style={styles.input}
                    />
    
                    <TouchableOpacity style={styles.button} onPress={authenticateUser}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={registerUser}>
                        <Text style={styles.buttonText}>Cadastrar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View>
                    {/* Configurações para personalizar a senha */}
                    <View style={styles.switchContainer}>
                        <Text style={{ color: darkMode ? '#fff' : '#333' }}>Usar Números</Text>
                        <Switch value={useNumbers} onValueChange={setUseNumbers} />
                    </View>
                    <View style={styles.switchContainer}>
                        <Text style={{ color: darkMode ? '#fff' : '#333' }}>Usar Letras Minúsculas</Text>
                        <Switch value={useLowerCase} onValueChange={setUseLowerCase} />
                    </View>
                    <View style={styles.switchContainer}>
                        <Text style={{ color: darkMode ? '#fff' : '#333' }}>Usar Letras Maiúsculas</Text>
                        <Switch value={useUpperCase} onValueChange={setUseUpperCase} />
                    </View>
                    <View style={styles.switchContainer}>
                        <Text style={{ color: darkMode ? '#fff' : '#333' }}>Usar Caracteres Especiais</Text>
                        <Switch value={useSymbols} onValueChange={setUseSymbols} />
                    </View>
                    <Text style={{ color: darkMode ? '#fff' : '#333', marginTop: 10 }}>Tamanho da Senha</Text>
                    <TextInput
                        keyboardType="numeric"
                        style={styles.input}
                        value={passwordLength}
                        onChangeText={(text) => {
                            const length = text.replace(/[^0-9]/g, ''); // Garante que só números sejam inseridos
                            setPasswordLength(length);
                        }}
                    />
    
                    <TouchableOpacity style={styles.button} onPress={generatePassword}>
                        <Text style={styles.buttonText}>Gerar Senha</Text>
                    </TouchableOpacity>
                    <Text style={styles.passwordText}>{password ? `Senha: ${password}` : "Nenhuma senha gerada"}</Text>
                    
                    <Text style={styles.passwordStrengthText}>
                        {passwordStrength ? `Força da Senha: ${passwordStrength}` : ''}
                    </Text>
    
                    <TouchableOpacity style={styles.button} onPress={addToFavorites}>
                        <Text style={styles.buttonText}>Favoritar Senha</Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity style={styles.button} onPress={() => setShowGeneratedModal(true)}>
                        <Text style={styles.buttonText}>Histórico de Senhas</Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity style={styles.button} onPress={() => setShowFavoritesModal(true)}>
                        <Text style={styles.buttonText}>Senhas Favoritas</Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity style={styles.button} onPress={logoutUser}>
                        <Text style={styles.buttonText}>Deslogar</Text>
                    </TouchableOpacity>
                </View>
            )}
    
            {/* Modal de Histórico de Senhas */}
            <Modal
                visible={showGeneratedModal}
                animationType="slide"
                onRequestClose={() => setShowGeneratedModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Histórico de Senhas</Text>
                    <FlatList
                        data={generatedPasswords}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <Text style={styles.modalItem}>{item}</Text>
                        )}
                    />
                    <TouchableOpacity style={styles.button} onPress={() => setShowGeneratedModal(false)}>
                        <Text style={styles.buttonText}>Fechar</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
    
            {/* Modal de Senhas Favoritas */}
            <Modal
                visible={showFavoritesModal}
                animationType="slide"
                onRequestClose={() => setShowFavoritesModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Senhas Favoritas</Text>
                    <FlatList
                        data={favoritePasswords}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <Text style={styles.modalItem}>{item}</Text>
                        )}
                    />
                    <TouchableOpacity style={styles.button} onPress={() => setShowFavoritesModal(false)}>
                        <Text style={styles.buttonText}>Fechar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={exportFavorites}>
                        <Text style={styles.buttonText}>Exportar Senhas Favoritas</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
    
};

const getStyles = (darkMode) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: darkMode ? '#121212' : '#f8f8f8',
            padding: 20,
            paddingTop: 40,
        },
        headerContainer: {
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        header: {
            fontSize: 28,
            fontWeight: '600',
            color: darkMode ? '#ffffff' : '#333333',
        },
        subtitle: {
            fontSize: 16,
            color: '#999',
        },
        input: {
            height: 50,
            borderColor: darkMode ? '#444' : '#ccc',
            borderWidth: 1,
            borderRadius: 10,
            marginBottom: 20,
            paddingLeft: 15,
            fontSize: 16,
            color: darkMode ? '#ffffff' : '#333333',
            backgroundColor: darkMode ? '#333' : '#fff',
        },
        button: {
            backgroundColor: '#4CAF50',
            paddingVertical: 15,
            borderRadius: 10,
            marginBottom: 15,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            width: '100%',
            transition: 'background-color 0.3s',
        },
        buttonText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: '500',
        },
        buttonSecondary: {
            backgroundColor: '#2196F3',
            paddingVertical: 15,
            borderRadius: 10,
            marginBottom: 15,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            transition: 'background-color 0.3s',
        },
        buttonSecondaryText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: '500',
        },

        buttonDangerText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: '500',
        },
        passwordText: {
            fontSize: 20,
            marginTop: 15,
            color: darkMode ? '#fff' : '#333',
        },
        passwordStrengthText: {
            color: darkMode ? '#aaa' : '#555',
            marginTop: 10,
        },
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: darkMode ? '#121212' : '#f8f8f8',
            padding: 20, // Para dar mais espaço ao conteúdo
        },
        modalTitle: {
            fontSize: 24,
            marginBottom: 20,
            color: darkMode ? '#fff' : '#333',
        },
        modalItem: {
            fontSize: 18,
            color: darkMode ? '#fff' : '#333',
            marginBottom: 10,
        },
        modalButton: {
            backgroundColor: '#FFEC00',
            paddingVertical: 15,  // Maior altura
            paddingHorizontal: 30, // Maior largura
            borderRadius: 10,
            marginBottom: 20,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            width: '80%', // Largura maior
        },
        modalButtonText: {
            color: '#333',
            fontSize: 18,
            fontWeight: '600',
        },
        closeButton: {
            backgroundColor: '#FF5722', // Laranja/avermelhado
            paddingVertical: 15,
            paddingHorizontal: 40, // Maior largura
            borderRadius: 10,
            marginBottom: 15,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            width: '80%', // Largura maior
        },
        closeButtonText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: '600',
        },
        switchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 20,
        },
    });
};



export default App;
