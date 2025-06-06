import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Hooks personalizados
import { useAuth } from '@/hooks/useAuth';

// Componentes
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import TermsCheckbox from '@/components/auth/TermsCheckbox';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, error: authError } = useAuth();
    
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    street: '',
    city: '',
    postcode: '',
    country: 'UK',
  });
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); 
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Total de passos do cadastro
  const TOTAL_STEPS = 2;
  
  // Limpa o erro quando os inputs mudam
  useEffect(() => {
    if (error) setError(null);
  }, [formData]);
  
  // Alterna a visibilidade da senha
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };
  
  // Atualiza os dados do formulário
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  // Validação básica do passo 1
  const validateStep1 = () => {
    if (!formData.displayName.trim()) {
      setError('Please, type your full name');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Please, type your email');
      return false;
    }
    
    // Validação simples de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please, Type an e-mail valid.');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('Please, Type your password');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  // Validação básica do passo 2
  const validateStep2 = () => {
    if (!formData.postcode.trim()) {
      setError('Please enter zip code');
      return false;
    }
    
    return true;
  };
  
  // Avança para o próximo passo
  const goToNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };
  
  // Volta para o passo anterior
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Navega para a tela de login
  const handleGoToLogin = () => {
    router.push('/(public)/LoginScreen');
  };
  
  // Registra o usuário
  const handleRegister = async () => {
    try {
      // Validação final
      if (!validateStep2()) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Preparar dados para registro
      const userData = {
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        street: formData.street,
        city: formData.city,
        postcode: formData.postcode,
        country: formData.country
      };
      
      // Realizar registro
      const result = await register(formData.email, formData.password, userData);
      
      if (!result.success) {
        setError(result.error);
      }
      
      // Se o registro for bem-sucedido, o redirecionamento será feito pelo useEffect no app/index.js
    } catch (error) {
      console.error('Error registering:', error);
      setError('An error occurred while trying to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Creating your account..." />;
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => currentStep === 1 ? router.back() : goToPreviousStep()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          {/* Indicador de progresso */}
          <View style={styles.progressContainer}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index + 1 === currentStep && styles.progressDotActive,
                  index + 1 < currentStep && styles.progressDotCompleted
                ]}
              />
            ))}
          </View>
          
          <View style={styles.placeholder} />
        </View>
        
        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {currentStep === 1 ? 'Create Account' : 'Your Address'}
          </Text>
          <Text style={styles.subtitle}>
            {currentStep === 1 
              ? 'Fill in your details to create an account' 
              : 'Enter your delivery address'}
          </Text>
        </View>
        
        {/* Mensagem de erro */}
        {(error || authError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || authError}</Text>
          </View>
        )}
        
        {/* Formulário - Passo 1: Dados Básicos */}
        {currentStep === 1 && (
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  value={formData.displayName}
                  onChangeText={(text) => handleInputChange('displayName', text)}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Your password"
                  secureTextEntry={!passwordVisible}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={togglePasswordVisibility}
                >
                  <MaterialIcons
                    name={passwordVisible ? "visibility-off" : "visibility"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <PasswordStrengthIndicator password={formData.password} />
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  secureTextEntry={!passwordVisible}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Telefone (opcional)</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="phone" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your phone number"
                  keyboardType="phone-pad"
                  value={formData.phoneNumber}
                  onChangeText={(text) => handleInputChange('phoneNumber', text)}
                />
              </View>
            </View>
            
            <Button
              title="Next"
              onPress={goToNextStep}
              style={styles.submitButton}
            />
            <SocialLoginButtons
              onGooglePress={() => console.log('Google')}
              onApplePress={() => console.log('Apple')}
            />
          </View>
        )}
        
        {/* Formulário - Passo 2: Endereço */}
        {currentStep === 2 && (
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rua/Avenida (opcional)</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="home" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your street address"
                  value={formData.street}
                  onChangeText={(text) => handleInputChange('street', text)}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cidade (opcional)</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="location-city" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your city"
                  value={formData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Código Postal</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="markunread-mailbox" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your postcode"
                  value={formData.postcode}
                  onChangeText={(text) => handleInputChange('postcode', text)}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>País</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="public" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your country"
                  value={formData.country}
                  onChangeText={(text) => handleInputChange('country', text)}
                />
              </View>
            </View>
            
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By clicking "Create Account", you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> e{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
            
            <TermsCheckbox
              checked={termsAccepted}
              onToggle={() => setTermsAccepted(!termsAccepted)}
              onPrivacyPress={() => console.log('Privacy clicked')}
              onTermsPress={() => console.log('Terms clicked')}
            />
            <Button
              title="Create Account"
              onPress={handleRegister}
              style={styles.submitButton}
            />
          </View>
        )}
        
        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleGoToLogin}>
            <Text style={styles.footerLink}>Enter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#4B0082',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotCompleted: {
    backgroundColor: '#4B0082',
  },
  placeholder: {
    width: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  visibilityToggle: {
    padding: 12,
  },
  termsContainer: {
    marginVertical: 16,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#4B0082',
    textDecorationLine: 'underline',
  },
  submitButton: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B0082',
  },
});