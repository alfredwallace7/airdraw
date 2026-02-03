
from playwright.sync_api import sync_playwright, expect
import time

def verify_canvas(page):
    # Navigate to the app (assuming default Vite port)
    page.goto("http://localhost:3000")

    # Wait for the Enable Camera button
    page.wait_for_selector("text=Enable Camera")

    # Check for canvas elements (they might be transparent/empty but should be in DOM)
    # Using specific class names or structure
    static_canvas = page.locator("canvas").nth(0)
    active_canvas = page.locator("canvas").nth(1)

    # Assert they exist in DOM. To check visibility (opacity is 1, but empty), .to_be_visible() checks bounding box and display/visibility styles.
    expect(static_canvas).to_be_visible()
    expect(active_canvas).to_be_visible()

    # Check for console errors
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PageError: {err}"))

    # Take a screenshot
    page.screenshot(path="verification/verification.png")
    print("Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_canvas(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
