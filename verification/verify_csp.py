from playwright.sync_api import sync_playwright
import sys
import time

def verify_csp():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        csp_errors = []

        def on_console_message(msg):
            # Capture all errors to see what's happening
            if msg.type == "error":
                text = msg.text
                # Filter for CSP related keywords
                if "Content Security Policy" in text or "Refused to load" in text or "Refused to execute" in text or "Refused to connect" in text:
                    print(f"CSP Violation Detected: {text}")
                    csp_errors.append(text)
                else:
                    # Print other errors just in case
                    print(f"Console Error (Non-CSP): {text}")

        page.on("console", on_console_message)

        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000", wait_until="domcontentloaded")

            # Allow some time for async loads (like MediaPipe initialization)
            # MediaPipe loads WASM files which triggers CSP checks
            print("Waiting for page to stabilize...")
            page.wait_for_timeout(5000)

            screenshot_path = "/home/jules/verification/csp_verification.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            if csp_errors:
                print(f"Found {len(csp_errors)} CSP violations.")
                sys.exit(1)
            else:
                print("No CSP violations detected.")

        except Exception as e:
            print(f"Error during verification: {e}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    verify_csp()
