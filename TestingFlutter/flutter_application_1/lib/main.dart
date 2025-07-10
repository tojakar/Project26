import 'package:flutter/material.dart';
import 'package:flutter_application_1/SignUp_page.dart';
import 'home_page.dart';
import 'map_page.dart';
import 'about_page.dart';
import 'Login_page.dart';

void main() {
  runApp(const MyApp()); // <-- FIX: Make MaterialApp the top-level widget
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Water Watch',
      theme: ThemeData(primarySwatch: Colors.red),
      home: const MyHomePage(), // ← Now home is a child of MaterialApp
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Water Watch'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Top Row of Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const HomePage()),
                    );
                  },
                  child: const Text('Home'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const MapPage()),
                    );
                  },
                  child: const Text('Map'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const AboutPage()),
                    );
                  },
                  child: const Text('About'),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Image in between
            Expanded(
              child: Center(
                child: Image.asset(
                  'assets/Sunset.jpg',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Bottom Left Sign Up Button
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const SignUpPage()),
                    );
                  },
                  child: const Text('Sign Up'),
                ),

                // Bottom Right Login Button
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const LoginPage()),
                    );
                  },
                  child: const Text('Log In'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
