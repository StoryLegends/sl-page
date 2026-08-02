public class TestEscape {
    public static void main(String[] args) {
        String line = "\"Image Name\",\"PID\" | \"NT AUTHORITY\\SYSTEM\"";
        String fixed = line.replace("\\", "\\\\").replace("\"", "\\\"");
        System.out.println("Original: " + line);
        System.out.println("Fixed: " + fixed);
    }
}
