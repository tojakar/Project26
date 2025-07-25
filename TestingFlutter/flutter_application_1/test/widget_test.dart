import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/main.dart'; // Update if your main.dart path is different
import 'package:flutter/material.dart';

void main() {
  group('Water Watch App Tests', () {
    
    testWidgets('1️⃣ Landing screen shows app title and buttons', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());

      expect(find.text('Water Watch'), findsOneWidget);
      expect(find.text('Find your favorite fountain'), findsOneWidget);
      expect(find.text('Register'), findsOneWidget);
      expect(find.text('Login'), findsOneWidget);
    });

    testWidgets('2️⃣ Tapping Login navigates to Login screen', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());

      await tester.tap(find.text('Login'));
      await tester.pumpAndSettle();

      expect(find.text('Email'), findsOneWidget); // Replace with actual Login page content
    });

    testWidgets('3️⃣ Tapping Register navigates to Register screen', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());

      await tester.tap(find.text('Register'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(ElevatedButton, 'Sign Up'), findsOneWidget);
    });

  });
}