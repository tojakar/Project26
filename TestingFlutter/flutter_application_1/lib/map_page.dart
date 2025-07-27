import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_application_1/search_bar.dart';

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

  Future<void> addFountainMarker(dynamic wf) async {
    final LatLng latLng = LatLng(wf['latitude'], wf['longitude']);
    final userData = await ApiService.getUserData();
    final currentUserId = userData?['userId'];
    final isOwner = wf['userId'] == currentUserId;

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

    setState(() {
      _markers.add(marker);
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Water Watch'),
          centerTitle: true,
        ),
        body: Column(
          children: [
            Image.asset('assets/logo.png'),
            Padding(
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
