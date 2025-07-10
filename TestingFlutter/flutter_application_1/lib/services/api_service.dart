// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5000'; // Replace with your backend URL
  
  // Register user - matches your /api/register endpoint
  static Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/register'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'password': password,
        }),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'],
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': data['error'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }
  
  // Login user - matches your /api/login endpoint
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        // Save JWT token to local storage
        if (data['accessToken'] != null) {
          await saveToken(data['accessToken']);
        }
        
        return {
          'success': true,
          'id': data['id'],
          'firstName': data['firstName'],
          'lastName': data['lastName'],
          'accessToken': data['accessToken'],
        };
      } else {
        return {
          'success': false,
          'message': data['error'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }
  
  // Save JWT token to SharedPreferences
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
  }
  
  // Get JWT token from SharedPreferences
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }
  
  // Save user data to SharedPreferences
  static Future<void> saveUserData({
    required String id,
    required String firstName,
    required String lastName,
    required String email,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', id);
    await prefs.setString('user_firstName', firstName);
    await prefs.setString('user_lastName', lastName);
    await prefs.setString('user_email', email);
  }
  
  // Get user data from SharedPreferences
  static Future<Map<String, String?>> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'id': prefs.getString('user_id'),
      'firstName': prefs.getString('user_firstName'),
      'lastName': prefs.getString('user_lastName'),
      'email': prefs.getString('user_email'),
    };
  }
  
  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }
  
  // Logout user
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('user_id');
    await prefs.remove('user_firstName');
    await prefs.remove('user_lastName');
    await prefs.remove('user_email');
  }
}