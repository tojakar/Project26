import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_application_1/search_bar.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final Completer<GoogleMapController> _controller = Completer();
  final Set<Marker> _markers = {};
  final TextEditingController _searchController = TextEditingController();
  LatLng? _currentPosition;

  @override
  void initState() {
    super.initState();
    _determinePosition();
    _loadAllFountains();
  }

  Future<void> _determinePosition() async {
    LocationPermission permission;
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission != LocationPermission.whileInUse &&
          permission != LocationPermission.always) {
        return;
      }
    }
    Position position = await Geolocator.getCurrentPosition();
    setState(() {
      _currentPosition = LatLng(position.latitude, position.longitude);
    });
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
    try {
      final data = await ApiService.getAllWaterFountains();
      return data['fountains'] ?? [];
    } catch (e) {
      print('Error fetching fountains: $e');
      return [];
    }
  }

  Future<void> _showStatus(String message, {bool success = true}) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );
  }

  Future<void> _handleAddFountain(LatLng location) async {
    final result = await showDialog(
      context: context,
      builder: (context) => AddFountainDialog(location: location),
    );
    if (result == true) {
      _loadAllFountains();
      _showStatus('Fountain added!');
    }
  }

  Future<void> _editFountain(dynamic fountain) async {
    final result = await showDialog(
      context: context,
      builder: (context) => EditFountainDialog(fountain: fountain),
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
    if (result == true) {
      _loadAllFountains();
      _showStatus('Fountain updated!');
    }
  }

  Future<void> _deleteFountain(String id) async {
    final result = await ApiService.deleteWaterFountain(id);
    if (result['success'] == true) {
      _loadAllFountains();
      _showStatus('Fountain deleted!');
    } else {
      _showStatus('Failed to delete fountain', success: false);
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
  Future<void> addFountainMarker(dynamic wf) async {
    final LatLng latLng = LatLng(wf['latitude'], wf['longitude']);
    final userData = await ApiService.getUserData();
    final currentUserId = userData?['userId'];
    final isOwner = wf['userId'] == currentUserId;

  final marker = Marker(
    key: ValueKey(fountainId),
    width: 40,
    height: 40,
    point: LatLng(lat, lng),
    child: GestureDetector(
      onTap: () {
      

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
                              fountainId, lvl, token!
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
                      initialRating: userRating ?? 0,
                      minRating: 1,
                      itemCount: 5,
                      itemSize: 28,
                      itemBuilder: (_, __) =>
                        const Icon(Icons.star, color: Colors.amber),
                      updateOnDrag: true,
                      onRatingUpdate: (newRating) async {
                        setStateDialog(() => userRating = newRating);
                        final resp = await ApiService.rateWaterFountain(
                          fountainId, newRating, token!
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
    final marker = Marker(
      markerId: MarkerId(wf['_id']),
      position: latLng,
      infoWindow: InfoWindow(title: wf['name'] ?? 'Unnamed Fountain'),
      onTap: () async {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(wf['name'] ?? 'Unnamed Fountain'),
            content: Text('Do you want to edit or delete this fountain?'),
            actions: [
              if (isOwner) ...[
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _editFountain(wf);
                  },
                  child: const Text('Edit'),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _deleteFountain(wf['_id']);
                  },
                  child: const Text('Delete'),
                ),
              ],
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      },
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
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Water Watch'),
          centerTitle: true,
        ),
        body: Column(
          children: [
            const SizedBox(height: 16),
            Image.asset('assets/logo.png'),
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
              padding: const EdgeInsets.all(8.0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search fountains...',
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.search),
                    onPressed: () async {
                      FocusScope.of(context).unfocus();
                      final query = _searchController.text.trim();
                      if (query.isEmpty) {
                        _loadAllFountains();
                        return;
                      }
                      final result = await ApiService.searchWaterFountains(query);
                      if (result['success'] == true) {
                        final fountains = result['fountains'] ?? [];
                        setState(() {
                          _markers.clear();
                          for (final f in fountains) {
                            addFountainMarker(f);
                          }
                        });
                      }
                    },
                  ),
                ),
                onSubmitted: (_) => FocusScope.of(context).unfocus(),
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
            Expanded(
              child: _currentPosition == null
                  ? const Center(child: CircularProgressIndicator())
                  : GoogleMap(
                      onMapCreated: (GoogleMapController controller) {
                        _controller.complete(controller);
                      },
                      markers: _markers,
                      initialCameraPosition: CameraPosition(
                        target: _currentPosition!,
                        zoom: 14.0,
                      ),
                      onLongPress: _handleAddFountain,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
}

class AddFountainDialog extends StatefulWidget {
  final LatLng location;
  const AddFountainDialog({super.key, required this.location});

  @override
  State<AddFountainDialog> createState() => _AddFountainDialogState();
}

class _AddFountainDialogState extends State<AddFountainDialog> {
  final TextEditingController _nameController = TextEditingController();

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    final result = await ApiService.createWaterFountain(
      name,
      widget.location.latitude,
      widget.location.longitude,
    );
    Navigator.of(context).pop(result['success'] == true);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Water Fountain'),
      content: TextField(
        controller: _nameController,
        decoration: const InputDecoration(hintText: 'Enter name'),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: _submit,
          child: const Text('Submit'),
        ),
      ],
    );
  }
}

class EditFountainDialog extends StatefulWidget {
  final dynamic fountain;
  const EditFountainDialog({super.key, required this.fountain});

  @override
  State<EditFountainDialog> createState() => _EditFountainDialogState();
}

class _EditFountainDialogState extends State<EditFountainDialog> {
  late TextEditingController _nameController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.fountain['name']);
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    final result = await ApiService.updateWaterFountain(
      widget.fountain['_id'],
      name,
    );
    Navigator.of(context).pop(result['success'] == true);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit Water Fountain'),
      content: TextField(
        controller: _nameController,
        decoration: const InputDecoration(hintText: 'Enter new name'),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: _submit,
          child: const Text('Save'),
        ),
      ],
    );
  }
}
