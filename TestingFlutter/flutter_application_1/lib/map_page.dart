import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';

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
}
