import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flutter_application_1/main.dart';

void main() {
  testWidgets('Landing screen shows app title and buttons', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    // Check that the app title appears
    expect(find.text('Water Watch'), findsOneWidget);

    // Check for the subtitle
    expect(find.text('Find your favorite fountain'), findsOneWidget);

    // Check for Register and Login buttons
    expect(find.text('Register'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });
}