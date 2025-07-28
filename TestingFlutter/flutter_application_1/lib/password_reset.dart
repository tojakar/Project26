
import 'package:flutter/material.dart';
import 'services/api_service.dart';

class PasswordResetPage extends StatefulWidget {
  @override
  _PasswordResetPageState createState() => _PasswordResetPageState();
}

class _PasswordResetPageState extends State<PasswordResetPage> {
  final emailController = TextEditingController();
  final tokenController = TextEditingController();
  final newPasswordController = TextEditingController();

  String message = "";

  void requestReset() async {
    final res = await ApiService.requestPasswordReset(emailController.text);
    setState(() => message = res['message'] ?? "Reset email sent.");
  }

  void resetPassword() async {
    final res = await ApiService.resetPassword(tokenController.text, newPasswordController.text);
    setState(() => message = res['message'] ?? "Password updated.");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Password Reset")),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: emailController, decoration: InputDecoration(labelText: "Email")),
            ElevatedButton(onPressed: requestReset, child: Text("Send Reset Email")),
            Divider(),
            TextField(controller: tokenController, decoration: InputDecoration(labelText: "Token")),
            TextField(controller: newPasswordController, obscureText: true, decoration: InputDecoration(labelText: "New Password")),
            ElevatedButton(onPressed: resetPassword, child: Text("Reset Password")),
            Text(message)
          ],
        ),
      ),
    );
  }
}
