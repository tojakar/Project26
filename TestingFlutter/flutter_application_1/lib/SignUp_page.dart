import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
            const SnackBar(content: Text('Please check your email to verify your account.')),
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginPage()),
          );
        }
      } else {
        setState(() => _errorMessage = result['error'] ?? result['message'] ?? 'Registration failed');
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
      backgroundColor: const Color(0xFFFCF7FF),
      appBar: AppBar(
        title: Text(
          'Sign Up',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            color: const Color(0xFF4A6FA5),
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF4A6FA5)),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Welcome Title
                  Text(
                    'Welcome!',
                    style: GoogleFonts.poppins(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF63CCCA),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: 8),
                  
                  Text(
                    'Create an account to get started',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: const Color(0xFF4A6FA5),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: 40),

                  // First Name TextField
                  SizedBox(
                    width: 300,
                    child: TextField(
                      controller: _firstNameController,
                      focusNode: _firstNameFocus,
                      decoration: InputDecoration(
                        labelText: 'First Name',
                        hintText: _firstNameController.text.isEmpty ? 'John' : null,
                        labelStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4A6FA5),
                        ),
                        hintStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4A6FA5).withOpacity(0.6),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF4A6FA5)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF4A6FA5)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF63CCCA), width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                      style: GoogleFonts.poppins(),
                      onChanged: (_) => setState(() {}),
                      onTap: () => setState(() {}),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Last Name TextField
                  SizedBox(
                    width: 300,
                    child: TextField(
                      controller: _lastNameController,
                      focusNode: _lastNameFocus,
                      decoration: InputDecoration(
                        labelText: 'Last Name',
                        hintText: _lastNameController.text.isEmpty ? 'Doe' : null,
                        labelStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4A6FA5),
                        ),
                        hintStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4A6FA5).withOpacity(0.6),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF4A6FA5)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF4A6FA5)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF63CCCA), width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                      style: GoogleFonts.poppins(),
                      onChanged: (_) => setState(() {}),
                      onTap: () => setState(() {}),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Email TextField
                  SizedBox(
                    width: 300,
                    child: TextField(
                      controller: _emailController,
                      focusNode: _emailFocus,
                      decoration: InputDecoration(
                        labelText: 'Email',
                        hintText: _emailController.text.isEmpty ? 'john.doe@example.com' : null,
                        labelStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4A6FA5),
                        ),
                        hintStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4A6FA5).withOpacity(0.6),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF4A6FA5)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF4A6FA5)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF63CCCA), width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                      style: GoogleFonts.poppins(),
                      keyboardType: TextInputType.emailAddress,
                      onChanged: (_) => setState(() {}),
                      onTap: () => setState(() {}),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Password TextField
                  SizedBox(
                    width: 300,
                    child: TextField(
                      controller: _passwordController,
                      focusNode: _passwordFocus,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        hintText: _passwordController.text.isEmpty ? '******' : null,
                        labelStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4A6FA5),
                        ),
                        hintStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4A6FA5).withOpacity(0.6),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF4A6FA5)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF4A6FA5)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF63CCCA), width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility : Icons.visibility_off,
                            color: const Color(0xFF4A6FA5),
                          ),
                          onPressed: () => setState(() {
                            _obscurePassword = !_obscurePassword;
                          }),
                        ),
                      ),
                      style: GoogleFonts.poppins(),
                      onChanged: (_) => setState(() {}),
                      onTap: () => setState(() {}),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Error message display
                  if (_errorMessage.isNotEmpty)
                    SizedBox(
                      width: 300,
                      child: Text(
                        _errorMessage,
                        style: GoogleFonts.poppins(
                          color: Colors.red,
                          fontSize: 14,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  const SizedBox(height: 30),

                  // Sign Up Button
                  SizedBox(
                    width: 250,
                    height: 45,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSignUp,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4A6FA5),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            )
                          : Text(
                              'Sign Up',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Login text
                  Text(
                    'Already have an account?',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: const Color(0xFF4A6FA5),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  

                  const SizedBox(height: 20),

                  // Login Button
                  SizedBox(
                    width: 250,
                    height: 45,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const LoginPage()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        foregroundColor: const Color(0xFF4A6FA5),
                        elevation: 0,
                        side: const BorderSide(color: Color(0xFF4A6FA5), width: 2),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Log In',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}