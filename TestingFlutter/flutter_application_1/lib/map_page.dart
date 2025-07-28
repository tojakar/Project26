import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_application_1/search_bar.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final List<Marker> _markers = [];
  LatLng? _currentPosition;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _determinePosition();
    _loadAllFountains();
  }

  Future<void> _determinePosition() async {
    final hasPermission = await _handleLocationPermission();
    if (!hasPermission) return;

    try {
      final position = await Geolocator.getCurrentPosition();
      setState(() {
        _currentPosition = LatLng(position.latitude, position.longitude);
      });
      
      // Move map to current location if available
      if (_currentPosition != null) {
        _mapController.move(_currentPosition!, 16.0);
      }
    } catch (e) {
      _showStatus('Could not get current location', 'error');
    }
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
  final fountainId  = fountain['_id'] as String;
  final lat         = (fountain['yCoord']     as num?)?.toDouble() ?? 0.0;
  final lng         = (fountain['xCoord']     as num?)?.toDouble() ?? 0.0;
  final name        = fountain['name']         as String? ?? 'Unknown';
  final description = fountain['description']  as String? ?? '';
  final createdBy   = fountain['createdBy']    as String? ?? '';
  double avgFilter   = (fountain['filterLevel'] as num?)?.toDouble() ?? 0.0;
  double avgRating   = (fountain['rating']      as num?)?.toDouble() ?? 0.0;

  // Pull current userId + token once
  final userData = await ApiService.getUserData();
  final currentUserId = userData['userId'];
  final token = await ApiService.getToken();


  if (currentUserId == null || token == null) {
    _showStatus('You must be logged in to interact with fountains', 'error');
    return;
  }
   
  // Load *this user’s* previous ratings (may be null)
  double userFilter = await ApiService.getUserFilterForFountain(fountainId, token) ?? 0.0;
  double userRating = await ApiService.getUserRatingForFountain(fountainId, token) ?? 0.0;

  final marker = Marker(
    key: ValueKey(fountainId),
    width: 40,
    height: 40,
    point: LatLng(lat, lng),
    child: GestureDetector(
      onTap: () {
      
        Future.microtask(() {
    FocusScope.of(navigatorKey.currentContext!).unfocus();
  });

        showDialog(
          context: navigatorKey.currentContext!,
          builder: (dialogContext) => StatefulBuilder(
            
            builder: (ctx, setStateDialog) {
              return AlertDialog(
                scrollable: true,
                title: Text(name),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(description),
                    const SizedBox(height: 12),

                    // ── Filter Level ───────────────────
                    Text('Filter Level: ${avgFilter.toStringAsFixed(1)} / 3'),
                    Row(
                      children: List.generate(3, (i) {
                        final lvl = i + 1;
                        return GestureDetector(
                          onTap: () async {
                            setStateDialog(() => userFilter = lvl.toDouble());
                            final resp = await ApiService.rateFilterLevel(
                              fountainId, lvl, token
                            );
                            setStateDialog(() {
                              avgFilter = (resp['averageFilterLevel'] as num?)
                                  ?.toDouble() ?? userFilter;
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey),
                              color: lvl <= userFilter
                                  ? Colors.blue.shade100
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text('$lvl'),
                          ),
                        );
                      }),
                    ),

                    const SizedBox(height: 16),

                    // ── Star Rating ─────────────────────
                    Text('Rating: ${avgRating.toStringAsFixed(1)} / 5'),
                    RatingBar.builder(
                      initialRating: userRating,
                      minRating: 1,
                      itemCount: 5,
                      itemSize: 28,
                      itemBuilder: (_, __) =>
                        const Icon(Icons.star, color: Colors.amber),
                      updateOnDrag: true,
                      onRatingUpdate: (newRating) async {
                        setStateDialog(() => userRating = newRating);
                        final resp = await ApiService.rateWaterFountain(
                          fountainId, newRating, token
                        );
                        setStateDialog(() {
                          avgRating = (resp['averageRating'] as num?)
                              ?.toDouble() ?? userRating;
                        });
                      },
                    ),

                    const SizedBox(height: 16),

                    // ── Owner Actions ───────────────────
                    if (currentUserId == createdBy)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ElevatedButton.icon(
                            icon: const Icon(Icons.edit),
                            label: const Text('Edit'),
                            onPressed: () {
                              Navigator.of(dialogContext).pop();
                              _editFountain(fountain);
                            },
                          ),
                          ElevatedButton.icon(
                            icon: const Icon(Icons.delete),
                            label: const Text('Delete'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                            ),
                            onPressed: () {
                              Navigator.of(dialogContext).pop();
                              _deleteFountain(fountainId);
                            },
                          ),
                        ],
                      ),
                  ],
                ),
              );
            },
          ),
        );
      },
      child: const Icon(Icons.water_drop, size: 30, color: Colors.blue),
    ),
  );

  setState(() => _markers.add(marker));
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

  Future<void> _handleAddFountain({LatLng? location}) async {
    LatLng targetLocation;
    
    if (location != null) {
      // Use provided location (from long press)
      targetLocation = location;
    } else {
      // Use current location
      final hasPermission = await _handleLocationPermission();
      if (!hasPermission) return;

      final position = await Geolocator.getCurrentPosition();
      targetLocation = LatLng(position.latitude, position.longitude);
    }

    final formData = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (_) => AddFountainDialog(location: targetLocation),
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
      'xCoord': targetLocation.longitude,
      'yCoord': targetLocation.latitude,
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
      body: GestureDetector(
  behavior: HitTestBehavior.opaque,
  onTap: () => FocusScope.of(context).unfocus(),
  child: Center(
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
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              Text(
                'Long press on the map to add a fountain at any location',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: const Color(0xFF4A6FA5),
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
              if (_currentPosition == null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'Getting your location...',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
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
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _currentPosition ?? const LatLng(28.6023, -81.2005),
                initialZoom: 15,
                onLongPress: (tapPosition, point) {
                  _handleAddFountain(location: point);
                },
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.flutter_application_1',
                ),
                MarkerLayer(
                  markers: [
                    ..._markers,
                    if (_currentPosition != null)
                      Marker(
                        width: 40,
                        height: 40,
                        point: _currentPosition!,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.blue,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                          ),
                          child: const Icon(
                            Icons.my_location,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            ElevatedButton.icon(
              onPressed: _currentPosition != null ? _handleAddFountain : null,
              icon: const Icon(Icons.my_location),
              label: const Text('Add at My Location'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4A6FA5),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            if (_currentPosition != null)
              ElevatedButton.icon(
                onPressed: () {
                  _mapController.move(_currentPosition!, 16);
                },
                icon: const Icon(Icons.center_focus_strong),
                label: const Text('Center Map'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF63ccca),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
          ],
        ),
        const Spacer(flex: 3),
      ],
    ),
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