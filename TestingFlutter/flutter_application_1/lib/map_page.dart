import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'package:geolocator/geolocator.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  List<Marker> _markers = [];

  @override
  void initState() {
    super.initState();
    // Fetch water fountains when the page is initialized
    _fetchWaterFountains().then((waterFountains) {
      for (int i = 0; i < waterFountains.length; i++) {
        addFountainMarker(waterFountains[i]);
      }
    });
    
  }

  Future<List<dynamic>> _fetchWaterFountains() async {
    final result = await ApiService.getAllWaterFountains();

    if (result['success']) {
      
      return result['waterFountains']; // return the actual data
    } 
    else {
      print('❌ Failed to fetch fountains: ${result['message']}');
      return [];
    }
  }

  void addFountainMarker(Map<String, dynamic> fountain) {
    final double lat = fountain['yCoord']?.toDouble() ?? 0.0;
    final double lng = fountain['xCoord']?.toDouble() ?? 0.0;
    final String name = fountain['name'] ?? 'Unknown';
    final String description = fountain['description'] ?? '';
    final int filterLevel = fountain['filterLevel'] ?? 0;
    final int rating = fountain['rating'] ?? 0;

    final marker = Marker(
      width: 100,
      height: 100,
      point: LatLng(lat, lng),
      child: GestureDetector(
        onTap: () {
          showDialog(
            context: navigatorKey.currentContext!,
            builder: (context) => AlertDialog(
              title: Text(name),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(description),
                  Text('Filter Level: $filterLevel / 3'),
                  Text('Rating: $rating / 5 💧'),
                ],
              ),
            ),
          );
        },
        child: const Text(
          '💧',
          style: TextStyle(fontSize: 24),
        ),
      ),
    );

    // ✅ Add the new marker and trigger UI update
    setState(() {
      _markers.add(marker);
    });
  }

  Future<bool> _handleLocationPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showStatus('Location services are disabled.', 'error');
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _showStatus('Location permission denied.', 'error');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _showStatus('Location permission permanently denied.', 'error');
      return false;
    }

    return true;
  }

  void _showStatus(String message, String type) {
    final color = type == 'error' ? Colors.red : Colors.green;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: color),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFCF7FF),
      appBar: AppBar(
        title: Text(
          'Map',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            color: const Color(0xFF4A6FA5),
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF4A6FA5)),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Image.asset(
              'assets/logo.png',
              width: 50,
              height: 50,
            ),
            Text(
              'Water Watch',
              style: GoogleFonts.poppins(
                fontSize: 32,
                color: const Color(0xFF63ccca),
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF63ccca)),
                borderRadius: BorderRadius.circular(15),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: FlutterMap(
                  options: const MapOptions(
                    initialCenter: LatLng(28.6023, -81.2005),
                    initialZoom: 15,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.flutter_application_1',
                    ),
                    MarkerLayer(
                      markers: _markers,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4A6FA5),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onPressed: () {
                _handleAddFountain();
                print('Add fountain button pressed');
              },
              child: const Text('Add Fountain at My Location'),
            ),
            const Spacer(flex: 3),
          ],
        ),
      ),
    );
  }

    Future<void> _handleAddFountain() async {
    print('✅ Start: Add fountain button pressed');

    final hasPermission = await _handleLocationPermission();
    print('🔍 Location permission granted: $hasPermission');
    if (!hasPermission) return;

    final position = await Geolocator.getCurrentPosition();
    final lat = position.latitude;
    final lng = position.longitude;
    print('📍 Current location: ($lat, $lng)');

    final location = LatLng(lat, lng);

    final formData = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (_) => AddFountainDialog(location: location),
    );

    print('📨 Form data submitted: $formData');

    if (formData == null) {
      print('🚫 Form dialog was cancelled or closed');
      return;
    }

    final token = await ApiService.getToken();
    print('🔑 JWT Token: $token');
    if (token == null) {
      _showStatus('Please log in to add fountains', 'error');
      return;
    }

    final fountainData = {
      'name': formData['name'],
      'description': formData['description'],
      'filterLevel': formData['filterLevel'],
      'rating': formData['rating'],
      'xCoord': location.longitude,
      'yCoord': location.latitude,
      'jwtToken': token
    };

    print('📦 Sending fountainData to API: $fountainData');

    Map<String, dynamic> result = {};
    try {
      result = await ApiService.addWaterFountain(fountainData);
      print('📥 API result: $result');
    } catch (e) {
      print('❌ Exception during API call: $e');
      _showStatus('Something went wrong when adding the fountain.', 'error');
      return;
    }

    print('📊 Result type: ${result.runtimeType}');

    // Don't crash if fields are missing
    try {
      final added = result['addedWaterFountain'];
      _showStatus('Fountain added!', 'success');
      if (added is Map<String, dynamic>) {
        print('🎯 Adding returned fountain marker');
        addFountainMarker(added);
      } else {
        print('🧩 Adding fallback fountain marker');
        addFountainMarker(fountainData);
      }
    } catch (e) {
      print('⚠️ Unexpected format or missing fields: $e');
      _showStatus('Fountain added, but response was weird.', 'success');
      addFountainMarker(fountainData);
    }

    print('✅ End: Add fountain logic');
  }
}
 

class AddFountainDialog extends StatefulWidget {
  final LatLng location;
  const AddFountainDialog({required this.location});

  @override
  _AddFountainDialogState createState() => _AddFountainDialogState();
}

class _AddFountainDialogState extends State<AddFountainDialog> {
  final _formKey = GlobalKey<FormState>();
  String name = '';
  String description = '';
  int filterLevel = 1;
  int rating = 5;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Water Fountain'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                decoration: const InputDecoration(labelText: 'Fountain Name'),
                onChanged: (val) => name = val,
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Description'),
                onChanged: (val) => description = val,
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              DropdownButtonFormField<int>(
                decoration: const InputDecoration(labelText: 'Filter Level'),
                value: filterLevel,
                items: [1, 2, 3]
                    .map((level) => DropdownMenuItem(value: level, child: Text('$level')))
                    .toList(),
                onChanged: (val) => setState(() => filterLevel = val ?? 1),
              ),
              DropdownButtonFormField<int>(
                decoration: const InputDecoration(labelText: 'Rating'),
                value: rating,
                items: [1, 2, 3, 4, 5]
                    .map((r) => DropdownMenuItem(value: r, child: Text('$r')))
                    .toList(),
                onChanged: (val) => setState(() => rating = val ?? 5),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState?.validate() ?? false) {
              Navigator.of(context).pop({
                'name': name.trim(),
                'description': description.trim(),
                'filterLevel': filterLevel,
                'rating': rating,
              });
            }
          },
          child: const Text('Submit'),
        ),
      ],
    );
  }
}

