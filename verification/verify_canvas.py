from playwright.sync_api import sync_playwright, expect

def verify_app_loads(page):
    print("Navigating to app...")
    page.goto("http://localhost:3000")

    # Wait for the main container or canvas to load
    print("Waiting for canvas...")
    page.wait_for_selector("canvas", timeout=10000)

    # Check for the HUD
    print("Checking for HUD...")
    expect(page.get_by_text("AirDraw")).to_be_visible()

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/app_loaded.png")
    print("Screenshot saved to verification/app_loaded.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_app_loads(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
