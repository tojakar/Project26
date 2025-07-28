import 'dart:convert';
import 'dart:developer';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart';
import 'dart:developer' show log;
class ApiService {
  static const String appName = 'group26.xyz';
  
  static String buildPath(String route) {
    if (kDebugMode) {
      if (kIsWeb) {
        return 'http://localhost:5001/$route';
      } else {
        return 'http://$appName:5001/$route'; 
      }
    } else {
      return 'http://$appName:5001/$route';
    }
  }

static Future<Map<String, dynamic>> postJson(String url, Map<String, dynamic> body) async {
  try {
    final response = await http.post(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    return jsonDecode(response.body);
  } catch (e) {
    print('POST error: $e');
    return {'error': 'Request failed'};
  }
}

static Future<Map<String, dynamic>> registerUser(String email, String password) async {
    return await postJson(buildPath('register'), {'email': email, 'password': password});
  }

  static Future<Map<String, dynamic>> requestPasswordReset(String email) async {
    return await postJson(buildPath('password/request-reset'), {'email': email});
  }

  static Future<Map<String, dynamic>> resetPassword(String token, String newPassword) async {
    return await postJson(buildPath('password/reset'), {'token': token, 'password': newPassword});
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
      
      if (response.statusCode == 200 && data.containsKey('accessToken')) {
        final String jwtToken = data['accessToken'];
        final payload = decodeJWT(jwtToken);
        
        if (payload != null) {
          await saveToken(jwtToken);
          
          return {
            'success': true,
            'userId': payload['userId']?.toString() ?? '',
            'firstName': payload['firstName']?.toString() ?? '',
            'lastName': payload['lastName']?.toString() ?? '',
            'accessToken': jwtToken,
          };
        } else {
          return {'success': false, 'error': 'Failed to decode token'};
        }
      } else {
        return {'success': false, 'error': data['error'] ?? 'Unknown login error'};
      }
    } catch (e) {
      print('Login error: $e');
      return {'success': false, 'error': 'An error occurred during login.'};
    }
  }

  // Register user
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
      
      if (response.statusCode == 201) {
        return {'success': true};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'error': data['error'] ?? 'Unknown registration error'};
      }
    } catch (e) {
      print('Registration error: $e');
      return {'success': false, 'error': 'An error occurred during registration.'};
    }
  }

  // Add a new water fountain
  static Future<Map<String, dynamic>> addWaterFountain(Map<String, dynamic> fountainData) async {
    final token = await getToken();
    if (token == null) {
      return {'success': false, 'error': 'Not authenticated'};
    }

    // Add the token to the data being sent
    fountainData['jwtToken'] = token;

    try {
      final response = await http.post(
        Uri.parse(buildPath('api/addWaterFountain')),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(fountainData),
      );
      
      final data = jsonDecode(response.body);

      if (data.containsKey('jwtToken')) {
        final dynamic tokenData = data['jwtToken'];
        if (tokenData is String) {
          await saveToken(tokenData);
        } else if (tokenData is Map && tokenData.containsKey('accessToken')) {
          await saveToken(tokenData['accessToken']);
        }
      }

      if (response.statusCode == 200 && (data['error'] == null || data['error'] == '')) {
        return {'success': true, 'fountain': data['addedWaterFountain']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to add fountain'};
      }
    } catch (e) {
      print('Add fountain error: $e');
      return {'success': false, 'error': 'An error occurred while adding the fountain.'};
    }
  }

  // Get all water fountains
  static Future<List<dynamic>> getAllWaterFountains() async {
    final token = await getToken();
    if (token == null) {
      return [];
    }

    try {
      final response = await http.post(
        Uri.parse(buildPath('api/getAllWaterFountains')),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'jwtToken': token}),
      );
      
      final data = jsonDecode(response.body);

      if (data.containsKey('jwtToken')) {
        final dynamic tokenData = data['jwtToken'];
        if (tokenData is String) {
          await saveToken(tokenData);
        } else if (tokenData is Map && tokenData.containsKey('accessToken')) {
          await saveToken(tokenData['accessToken']);
        }
      }

      if (response.statusCode == 200 && (data['error'] == null || data['error'] == '')) {
        return data['allWaterFountains'] ?? [];
      } else {
        print('Error fetching fountains: ${data['error']}');
        return [];
      }
    } catch (e) {
      print('Get all fountains error: $e');
      return [];
    }
  }

  // Save user data to SharedPreferences
  static Future<void> saveUserData({
    required String userId,
    required String firstName,
    required String lastName,
    required String email,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', userId);
    await prefs.setString('user_firstName', firstName);
    await prefs.setString('user_lastName', lastName);
    await prefs.setString('user_email', email);
  }

  // Get user data from SharedPreferences
  static Future<Map<String, String?>> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'userId': prefs.getString('user_id'),
      'firstName': prefs.getString('user_firstName'),
      'lastName': prefs.getString('user_lastName'),
      'email': prefs.getString('user_email'),
    };
  }

  // Save token to SharedPreferences
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
  }

  // Get token from SharedPreferences
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  // Clear token from SharedPreferences
  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }

   // Delete a water fountain by ID
  static Future<Map<String, dynamic>> deleteWaterFountain(String fountainId, String token) async {
    try {
      final response = await http.post(
        Uri.parse(buildPath('api/deleteWaterFountain')),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'id': fountainId,
          'jwtToken': token,
        }),
      );

      final data = jsonDecode(response.body);

      if (data.containsKey('jwtToken')) {
        final dynamic tokenData = data['jwtToken'];
        if (tokenData is String) {
          await saveToken(tokenData);
        } else if (tokenData is Map && tokenData.containsKey('accessToken')) {
          await saveToken(tokenData['accessToken']);
        }
      }

     if (response.statusCode == 200 && (data['error'] == null || data['error'] == '')) {
        return {'success': true}; // No 'fountain' key returned by backend
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to delete fountain'
        };
      }
    } catch (e) {
      print('Delete fountain error: $e');
      return {'success': false, 'error': 'An error occurred while deleting the fountain.'};
    }
  }

  // Edit a water fountain's name and description
  static Future<Map<String, dynamic>> editWaterFountain(String fountainId, Map<String, dynamic> updateData) async {
    try {
      final response = await http.post(
        Uri.parse(buildPath('api/editWaterFountain')),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'id': fountainId,
          'editedFields': {
            'name': updateData['name'],
            'description': updateData['description'],
          },
          'jwtToken': updateData['jwtToken'],
        }),
      );

      final data = jsonDecode(response.body);

      if (data.containsKey('jwtToken')) {
        final dynamic tokenData = data['jwtToken'];
        if (tokenData is String) {
          await saveToken(tokenData);
        } else if (tokenData is Map && tokenData.containsKey('accessToken')) {
          await saveToken(tokenData['accessToken']);
        }
      }

     if (response.statusCode == 200 && (data['error'] == null || data['error'] == '')) {
        return {'success': true};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to edit fountain'
        };
      }
    } catch (e) {
      print('Edit fountain error: $e');
      return {'success': false, 'error': 'An error occurred while editing the fountain.'};
    }
  }

   /// Rate filter level, returns { 'averageFilterLevel': double, … }
static Future<Map<String, dynamic>> rateFilterLevel(
  String fountainId,
  int level,
  String jwtToken,
) async {
  final userId = (await getUserData())['userId'];
  log('rateFilterLevel → userId=$userId, fountainId=$fountainId, level=$level, jwtToken=$jwtToken');
  final resp = await http.post(
    Uri.parse(buildPath('api/rateFilterLevel')),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'userId': userId,  // now non‑null?
      'fountainId': fountainId,
      'filterLevel': level,
      'jwtToken': jwtToken,
    }),
  );
  return jsonDecode(resp.body) as Map<String, dynamic>;
}

/// Rate water fountain, returns { 'averageRating': double, … }
static Future<Map<String, dynamic>> rateWaterFountain(
  String fountainId,
  double rating,
  String jwtToken,
) async {
  final userId = (await getUserData())['userId'];
  log('rateWaterFountain → userId=$userId, fountainId=$fountainId, rating=$rating, jwtToken=$jwtToken');
  final resp = await http.post(
    Uri.parse(buildPath('api/rateWaterFountain')),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'userId': userId,
      'fountainId': fountainId,
      'rating': rating,
      'jwtToken': jwtToken,
    }),
  );
  return jsonDecode(resp.body) as Map<String, dynamic>;
}

/// Get the *current user’s* star‐rating for this fountain (or null)
static Future<double?> getUserRatingForFountain(String fountainId, String jwtToken) async {
  final userId = (await getUserData())['userId'];
  final resp = await http.post(
    Uri.parse(buildPath('api/getUserRating')),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'userId': userId,
      'fountainId': fountainId,
      'jwtToken': jwtToken,
    }),
  );
  final map = jsonDecode(resp.body) as Map<String, dynamic>;
  // returns null if user never rated before
  return (map['rating'] as num?)?.toDouble();
}

/// Get the *current user’s* filter‐level for this fountain (or null)
static Future<double?> getUserFilterForFountain(String fountainId, String jwtToken) async {
  final userId = (await getUserData())['userId'];
  final resp = await http.post(
    Uri.parse(buildPath('api/getUserFilterLevel')),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'userId': userId,
      'fountainId': fountainId,
      'jwtToken': jwtToken,
    }),
  );
  final map = jsonDecode(resp.body) as Map<String, dynamic>;
  return (map['filterLevel'] as num?)?.toDouble();
}
}