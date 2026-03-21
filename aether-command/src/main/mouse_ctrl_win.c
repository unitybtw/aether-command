#include <windows.h>
#include <stdio.h>
#include <string.h>

int main(int argc, char *argv[]) {
    // Daemon Mode (Read from STDIN for zero-latency)
    char buffer[256];
    while (fgets(buffer, sizeof(buffer), stdin) != NULL) {
        if (strncmp(buffer, "click", 5) == 0) {
            INPUT input = {0};
            input.type = INPUT_MOUSE;
            input.mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
            SendInput(1, &input, sizeof(INPUT));
            
            Sleep(10);
            
            input.mi.dwFlags = MOUSEEVENTF_LEFTUP;
            SendInput(1, &input, sizeof(INPUT));
        } else if (strncmp(buffer, "scroll", 6) == 0) {
            int scrollY;
            if (sscanf(buffer, "scroll %d", &scrollY) == 1) {
                INPUT input = {0};
                input.type = INPUT_MOUSE;
                input.mi.dwFlags = MOUSEEVENTF_WHEEL;
                input.mi.mouseData = (DWORD)scrollY;
                SendInput(1, &input, sizeof(INPUT));
            }
        } else if (strncmp(buffer, "down", 4) == 0) {
            INPUT input = {0};
            input.type = INPUT_MOUSE;
            input.mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
            SendInput(1, &input, sizeof(INPUT));
        } else if (strncmp(buffer, "up", 2) == 0) {
            INPUT input = {0};
            input.type = INPUT_MOUSE;
            input.mi.dwFlags = MOUSEEVENTF_LEFTUP;
            SendInput(1, &input, sizeof(INPUT));
        } else if (strncmp(buffer, "drag", 4) == 0) {
             float x, y;
            if (sscanf(buffer, "drag %f %f", &x, &y) == 2) {
                INPUT input = {0};
                input.type = INPUT_MOUSE;
                input.mi.dx = (LONG)(x * (65535.0f / GetSystemMetrics(SM_CXSCREEN)));
                input.mi.dy = (LONG)(y * (65535.0f / GetSystemMetrics(SM_CYSCREEN)));
                input.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTDOWN;
                SendInput(1, &input, sizeof(INPUT));
            }
        } else {
            float x, y;
            if (sscanf(buffer, "%f %f", &x, &y) == 2) {
                INPUT input = {0};
                input.type = INPUT_MOUSE;
                // Windows uses absolute coordinates from 0-65535 for SendInput absolute moves
                input.mi.dx = (LONG)(x * (65535.0f / GetSystemMetrics(SM_CXSCREEN)));
                input.mi.dy = (LONG)(y * (65535.0f / GetSystemMetrics(SM_CYSCREEN)));
                input.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE;
                SendInput(1, &input, sizeof(INPUT));
            }
        }
    }
    return 0;
}
