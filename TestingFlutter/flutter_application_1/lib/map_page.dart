import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_application_1/search_bar.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final List<Marker> _markers = [];

  @override
  void initState() {
    super.initState();
    _loadAllFountains();
  }

  Future<void> _loadAllFountains() async {
    final all = await _fetchWaterFountains();
    setState(() {
      _markers.clear();
      for (final f in all) {
        addFountainMarker(f);
      }
    });
  }

  Future<List<dynamic>> _fetchWaterFountains() async {
    return await ApiService.getAllWaterFountains();
  }

  void _deleteFountain(String fountainId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Confirm Delete"),
        content: const Text("Are you sure you want to delete this fountain?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text("Delete")),
        ],
      ),
    );

    if (confirm != true) return;

    final token = await ApiService.getToken();
    if (token == null) {
      _showStatus("You must be logged in to delete fountains", "error");
      return;
    }

    final result = await ApiService.deleteWaterFountain(fountainId, token);

    if (result['success'] == true) {
      _showStatus("Fountain deleted", "success");
      setState(() {
        _markers.removeWhere((m) => (m.key as ValueKey).value == fountainId);
      });
    } else {
      _showStatus("Failed to delete fountain", "error");
    }
  }

  void _editFountain(Map<String, dynamic> fountain) async {
    final formData = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (_) => EditFountainDialog(initialData: fountain),
    );

    if (formData == null) return;

    final token = await ApiService.getToken();
    final result = await ApiService.editWaterFountain(fountain['_id'], {
      'name': formData['name'],
      'description': formData['description'],
      'jwtToken': token,
    });

    if (result['success'] == true) {
      _showStatus("Fountain updated!", "success");

      setState(() {
        _markers.removeWhere((m) => (m.key as ValueKey).value == fountain['_id']);
      });

      WidgetsBinding.instance.addPostFrameCallback((_) {
        final updatedFountain = {
          ...fountain,
          'name': formData['name'],
          'description': formData['description'],
        };
        addFountainMarker(updatedFountain);
      });
    } else {
      _showStatus("Failed to update fountain", "error");
    }
  }

  void addFountainMarker(Map<String, dynamic> fountain) async {
    final double lat = fountain['yCoord']?.toDouble() ?? 0.0;
    final double lng = fountain['xCoord']?.toDouble() ?? 0.0;
    final String name = fountain['name'] ?? 'Unknown';
    final String description = fountain['description'] ?? '';
    final String createdBy = fountain['createdBy'] ?? '';
    final double filterLevel = fountain['filterLevel']?.toDouble() ?? 0.0;
    final double rating = (fountain['rating'] as num?)?.toDouble() ?? 0.0;

    final userData = await ApiService.getUserData();
    final currentUserId = userData['userId'];

    final marker = Marker(
      key: ValueKey<String>(fountain['_id']),
      width: 40,
      height: 40,
      point: LatLng(lat, lng),
      child: GestureDetector(
        onTap: () {
          showDialog(
            context: navigatorKey.currentContext!,
            builder: (context) => AlertDialog(
              title: Text(name),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(description),
                  Text('Filter Level: ${filterLevel.toStringAsFixed(2)} / 3'),
                  Text('Rating: ${rating.toStringAsFixed(2)} / 5 💧'),
                  const SizedBox(height: 10),
                  if (currentUserId == createdBy)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        ElevatedButton.icon(
                          icon: const Icon(Icons.edit),
                          label: const Text("Edit"),
                          onPressed: () {
                            Navigator.pop(context);
                            _editFountain(fountain);
                          },
                        ),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.delete),
                          label: const Text("Delete"),
                          onPressed: () {
                            Navigator.pop(context);
                            _deleteFountain(fountain['_id']);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          );
        },
        child: const Text('💧', style: TextStyle(fontSize: 24)),
      ),
    );

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

  Future<void> _handleAddFountain() async {
    final hasPermission = await _handleLocationPermission();
    if (!hasPermission) return;

    final position = await Geolocator.getCurrentPosition();
    final location = LatLng(position.latitude, position.longitude);

    final formData = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (_) => AddFountainDialog(location: location),
    );

    if (formData == null) return;

    final token = await ApiService.getToken();
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
      'jwtToken': token,
    };

    final result = await ApiService.addWaterFountain(fountainData);

    if (result['success'] == true) {
      _showStatus('Fountain added!', 'success');
      addFountainMarker(result['fountain']);
    } else {
      _showStatus('Error: ${result['error']}', 'error');
    }
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
          children: [
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: WaterFountainSearchBar(
                onResults: (results) {
                  setState(() {
                    _markers.clear();
                    for (final fountain in results) {
                      addFountainMarker(fountain);
                    }
                  });
                },
                onClear: _loadAllFountains,
              ),
            ),
            const SizedBox(height: 16),
            Image.asset('assets/logo.png', width: 50, height: 50),
            Text(
              'Water Watch',
              style: GoogleFonts.poppins(
                fontSize: 32,
                color: const Color(0xFF63ccca),
                fontWeight: FontWeight.bold,
              ),
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
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.flutter_application_1',
                    ),
                    MarkerLayer(markers: _markers),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _handleAddFountain,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4A6FA5),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Add Fountain at My Location'),
            ),
            const Spacer(flex: 3),
          ],
        ),
      ),
    );
  }
}

class AddFountainDialog extends StatefulWidget {
  final LatLng location;
  const AddFountainDialog({super.key, required this.location});

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

class EditFountainDialog extends StatefulWidget {
  final Map<String, dynamic> initialData;
  const EditFountainDialog({super.key, required this.initialData});

  @override
  _EditFountainDialogState createState() => _EditFountainDialogState();
}

class _EditFountainDialogState extends State<EditFountainDialog> {
  final _formKey = GlobalKey<FormState>();
  late String name;
  late String description;

  @override
  void initState() {
    super.initState();
    name = widget.initialData['name'] ?? '';
    description = widget.initialData['description'] ?? '';
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit Fountain'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              initialValue: name,
              decoration: const InputDecoration(labelText: 'Fountain Name'),
              onChanged: (val) => name = val,
              validator: (val) => val == null || val.isEmpty ? 'Required' : null,
            ),
            TextFormField(
              initialValue: description,
              decoration: const InputDecoration(labelText: 'Description'),
              onChanged: (val) => description = val,
              validator: (val) => val == null || val.isEmpty ? 'Required' : null,
            ),
          ],
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
              });
            }
          },
          child: const Text('Save Changes'),
        ),
      ],
    );
  }
}
