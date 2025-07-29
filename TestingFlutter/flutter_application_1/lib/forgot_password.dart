import 'package:flutter/material.dart';
import 'services/api_service.dart';

class ForgotPasswordPage extends StatefulWidget {
  @override
  _ForgotPasswordPageState createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final TextEditingController emailController = TextEditingController();
  String message = "";

  void sendResetEmail() async {
    final res = await ApiService.requestPasswordReset(emailController.text);
    setState(() {
      message = "Please check your email for the password reset email.";
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Forgot Password")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Enter your email to reset your password."),
            SizedBox(height: 8),
            TextField(
              controller: emailController,
              decoration: InputDecoration(labelText: "Email"),
            ),
            SizedBox(height: 8),
            ElevatedButton(
              onPressed: sendResetEmail,
              child: Text("Send Reset Email"),
            ),
            SizedBox(height: 16),
            if (message.isNotEmpty)
              Text(message, style: TextStyle(color: Colors.green)),
          ],
        ),
      ),
    );
  }
}
