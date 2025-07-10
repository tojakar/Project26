import 'package:flutter/material.dart';
import 'package:flutter_application_1/Login_page.dart';
import 'services/api_service.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  final _firstNameFocus = FocusNode();
  final _lastNameFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();

  bool _obscurePassword = true;
  String _errorMessage = '';
  bool _isLoading = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _firstNameFocus.dispose();
    _lastNameFocus.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  void _handleSignUp() async {
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (firstName.isEmpty || lastName.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please fill in all fields.');
      return;
    }

    setState(() {
      _errorMessage = '';
      _isLoading = true;
    });

    try {
      print('Attempting signup with email: $email'); // Debug print
      
      // Call API with proper first and last names
      final result = await ApiService.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      );
      
      print('Signup result: $result'); // Debug print
      
      if (result['success'] == true) {
        setState(() => _errorMessage = '');
        // Navigate to login page
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account created successfully! Please log in.')),
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginPage()),
          );
        }
      } else {
        setState(() => _errorMessage = result['message'] ?? 'Registration failed');
      }
    } catch (e) {
      print('Signup error: $e'); // Debug print
      setState(() => _errorMessage = 'Network error: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign Up')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Text(
              'Welcome, create an Account Below!',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),

            // First Name TextField
            TextField(
              controller: _firstNameController,
              focusNode: _firstNameFocus,
              decoration: InputDecoration(
                labelText: 'First Name',
                hintText: _firstNameController.text.isEmpty ? 'John' : null,
                border: const OutlineInputBorder(),
              ),
              onChanged: (_) => setState(() {}),
              onTap: () => setState(() {}),
            ),
            const SizedBox(height: 20),

            // Last Name TextField
            TextField(
              controller: _lastNameController,
              focusNode: _lastNameFocus,
              decoration: InputDecoration(
                labelText: 'Last Name',
                hintText: _lastNameController.text.isEmpty ? 'Doe' : null,
                border: const OutlineInputBorder(),
              ),
              onChanged: (_) => setState(() {}),
              onTap: () => setState(() {}),
            ),
            const SizedBox(height: 20),

            // Email TextField
            TextField(
              controller: _emailController,
              focusNode: _emailFocus,
              decoration: InputDecoration(
                labelText: 'Email',
                hintText: _emailController.text.isEmpty ? 'john.doe@example.com' : null,
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              onChanged: (_) => setState(() {}),
              onTap: () => setState(() {}),
            ),
            const SizedBox(height: 20),

            // Password TextField
            TextField(
              controller: _passwordController,
              focusNode: _passwordFocus,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                labelText: 'Password',
                hintText: _passwordController.text.isEmpty ? '******' : null,
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                  onPressed: () => setState(() {
                    _obscurePassword = !_obscurePassword;
                  }),
                ),
              ),
              onChanged: (_) => setState(() {}),
              onTap: () => setState(() {}),
            ),
            const SizedBox(height: 16),

            // Error message display
            if (_errorMessage.isNotEmpty)
              Text(
                _errorMessage,
                style: const TextStyle(color: Colors.red),
              ),
            const SizedBox(height: 24),

            // Sign Up Button
            ElevatedButton(
              onPressed: _isLoading ? null : _handleSignUp,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Sign Up', style: TextStyle(fontSize: 16)),
              ),
            ),

            const SizedBox(height: 24),

            const Text(
              'Already Have an Account?',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 32),

            // Login Button
            ElevatedButton(
              onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginPage()),
                  );
                },
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                child: Text('Log In', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}