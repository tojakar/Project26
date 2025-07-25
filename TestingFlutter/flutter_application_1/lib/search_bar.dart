import 'package:flutter/material.dart';
import 'services/api_service.dart';

class WaterFountainSearchBar extends StatefulWidget {
  final Function(List<dynamic>) onResults;
  final VoidCallback onClear;

  const WaterFountainSearchBar({
    super.key,
    required this.onResults,
    required this.onClear,
  });

  @override
  State<WaterFountainSearchBar> createState() => _WaterFountainSearchBarState();
}

class _WaterFountainSearchBarState extends State<WaterFountainSearchBar> {
  final TextEditingController _controller = TextEditingController();
  bool _loading = false;

  void _showStatus(String message, String type) {
    final color = type == 'error' ? Colors.red : Colors.green;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: color),
    );
  }

  Future<void> _handleSearch() async {
    final query = _controller.text.trim();
    if (query.isEmpty) {
      _showStatus('Please enter a search term.', 'error');
      return;
    }

    setState(() => _loading = true);

    final token = await ApiService.getToken();
    if (token == null) {
      _showStatus('Please log in to search fountains.', 'error');
      setState(() => _loading = false);
      return;
    }

    final url = ApiService.buildPath('api/searchWaterFountainByName');
    final body = {
      'name': query,
      'jwtToken': token,
    };

    try {
      final response = await ApiService.postJson(url, body);

      if (response.containsKey('jwtToken')) {
        final newToken = response['jwtToken'];
        if (newToken is String) await ApiService.saveToken(newToken);
        else if (newToken is Map && newToken.containsKey('accessToken')) {
          await ApiService.saveToken(newToken['accessToken']);
        }
      }

      if (response['error'] != null && response['error'].toString().trim().isNotEmpty) {
        final error = response['error'].toString().toLowerCase();
        if (error.contains('token') || error.contains('expired')) {
          _showStatus('Session expired. Please log in again.', 'error');
        } else {
          _showStatus('Search error: ${response['error']}', 'error');
        }
        widget.onResults([]);
        return;
      }

      final List<dynamic> results = response['found'] ?? [];
      if (results.isNotEmpty) {
        widget.onResults(results);
        _showStatus('Found ${results.length} fountain(s).', 'success');
      } else {
        _showStatus('No fountains found for "$query".', 'error');
        widget.onResults([]);
      }
    } catch (e) {
      _showStatus('An unexpected error occurred.', 'error');
      widget.onResults([]);
    } finally {
      setState(() => _loading = false);
    }
  }

  void _handleClear() {
    _controller.clear();
    widget.onClear();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            autofocus: false,
            controller: _controller,
            onSubmitted: (_) => _handleSearch(),
            decoration: InputDecoration(
              hintText: 'Search fountains by name...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: _loading ? null : _handleSearch,
          child: Text(_loading ? 'Searching...' : 'Search'),
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: _handleClear,
          icon: const Icon(Icons.clear),
        ),
      ],
    );
  }
}
