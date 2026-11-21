import 'package:material_ui/material_ui.dart';

void main() {
  runApp(const NQLaApp());
}

class NQLaApp extends StatelessWidget {
  const NQLaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'نقلة — NQLa',
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(
          child: Text('NQLa Mobile App'),
        ),
      ),
    );
  }
}
