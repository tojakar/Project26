import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart'; // Add this import

class ApiService {
  static const String appName = 'group26.xyz';
  
  static String buildPath(String route) {
    if (kDebugMode) {
      if (kIsWeb) {
        return 'http://localhost:5001/$route';
      } else {
        return 'http://$appName:5001/$route'; // Use your actual server address
      }
    } else {
      return 'http://$appName:5001/$route';
    }
  }

  // Decode JWT token to extract user data
  static Map<String, dynamic>? decodeJWT(String token) {
    try {
      // Split the token and decode the payload (without verification for now)
      final parts = token.split('.');
      if (parts.length != 3) return null;
      
      // Decode the payload (second part)
      final payload = parts[1];
      
      // Add padding if needed
      String normalized = base64.normalize(payload);
      
      // Decode base64
      final decoded = utf8.decode(base64.decode(normalized));
      
      // Parse JSON
      return jsonDecode(decoded);
    } catch (e) {
      print('Error decoding JWT: $e');
      return null;
    }
  }

  // Login user - now handles JWT response
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(buildPath('api/login')),
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
        // The response should contain the JWT token directly
        String? jwtToken;
        
        // Check if the response is the JWT token directly or contains it
        if (data is String) {
          jwtToken = data; // JWT token is the entire response
        } else if (data is Map && data.containsKey('accessToken')) {
          jwtToken = data['accessToken']; // JWT token is in accessToken field
        } else if (data is Map && data.containsKey('token')) {
          jwtToken = data['token']; // JWT token is in token field
        } else {
          // Try to find any string that looks like a JWT token
          for (var value in data.values) {
            if (value is String && value.contains('.')) {
              jwtToken = value;
              break;
            }
          }
        }
        
        if (jwtToken != null) {
          // Decode the JWT to get user data
          final payload = decodeJWT(jwtToken);
          
          if (payload != null) {
            // Save JWT token
            await saveToken(jwtToken);
            
            return {
              'success': true,
              'id': payload['userId']?.toString() ?? '',
              'firstName': payload['firstName']?.toString() ?? '',
              'lastName': payload['lastName']?.toString() ?? '',
              'accessToken': jwtToken,
            };
          }
        }
        
        return {
          'success': false,
          'message': 'Invalid token format',
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

  // Register user - handles the response format from your backend
  static Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(buildPath('api/register')),
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
          'message': data['message'] ?? 'Registration successful',
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

  static Future<Map<String, dynamic>> getAllWaterFountains() async {
  try {
    final jwtToken = await getToken();
    if (jwtToken == null) {
      return {
        'success': false,
        'message': 'User not logged in',
      };
    }

    final response = await http.post(
      Uri.parse(buildPath('api/getAllWaterFountains')),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'jwtToken': jwtToken,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return {
        'success': true,
        'waterFountains': data['allWaterFountains'], // or adjust to match your backend response
      };
    } else {
      return {
        'success': false,
        'message': data['error'] ?? 'Failed to fetch fountains',
      };
    }
  } catch (e) {
    return {
      'success': false,
      'message': 'Network error: ${e.toString()}',
    };
  }
}


}