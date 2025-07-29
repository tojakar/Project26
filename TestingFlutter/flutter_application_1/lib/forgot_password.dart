import 'package:flutter/material.dart';
import 'services/api_service.dart';

class ForgotPasswordPage extends StatefulWidget {
  @override
  _ForgotPasswordPageState createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final TextEditingController emailController = TextEditingController();
  String message = "";
  bool isLoading = false;
  bool isSuccess = false;

  void sendResetEmail() async {
    if (emailController.text.trim().isEmpty) {
      setState(() {
        message = "Please enter your email address.";
        isSuccess = false;
      });
      return;
    }

    setState(() {
      isLoading = true;
      message = "";
    });

    final res = await ApiService.requestPasswordReset(emailController.text.trim());
    
    setState(() {
      isLoading = false;
      isSuccess = res['success'] == true;
      message = res['success'] == true 
        ? (res['message'] ?? "Password reset email sent successfully. Please check your email.")
        : (res['error'] ?? "Failed to send password reset email.");
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
              decoration: InputDecoration(
                labelText: "Email",
                enabled: !isLoading,
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 8),
            ElevatedButton(
              onPressed: isLoading ? null : sendResetEmail,
              child: isLoading 
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: 8),
                      Text("Sending..."),
                    ],
                  )
                : Text("Send Reset Email"),
            ),
            SizedBox(height: 16),
            if (message.isNotEmpty)
              Text(
                message, 
                style: TextStyle(
                  color: isSuccess ? Colors.green : Colors.red,
                  fontWeight: FontWeight.w500,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
