from playwright.sync_api import sync_playwright
import time

def verify_loading_state(page):
    # Capture logs
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

    # Mock getUserMedia to delay
    page.add_init_script("""
        if (!navigator.mediaDevices) {
            navigator.mediaDevices = {};
        }
        navigator.mediaDevices.getUserMedia = async (constraints) => {
            console.log("Mock getUserMedia called");
            await new Promise(r => setTimeout(r, 2000)); # Delay 2 seconds
            return {
                getTracks: () => [],
                getVideoTracks: () => []
            };
        };
    """)

    page.goto("http://localhost:3000")

    # Wait for the button
    enable_btn = page.get_by_role("button", name="Enable Camera")
    enable_btn.wait_for()

    # Click it
    print("Clicking Enable Camera...")
    enable_btn.click()

    # Check loading state
    # We want to see if it EVER becomes "Starting..."
    try:
        starting_btn = page.get_by_role("button", name="Starting...")
        starting_btn.wait_for(timeout=2000) # Wait up to 2s for it to appear
        print("Success: Button changed to 'Starting...'")

        # Take screenshot
        page.screenshot(path="verification/loading_state.png")

        if not starting_btn.is_disabled():
             print("Error: Button is not disabled")
        else:
             print("Success: Button is disabled")

    except Exception as e:
        print(f"Error: Button did not change to 'Starting...'. Error: {e}")
        # Print actual button text
        print(f"Button text: {enable_btn.text_content()}")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_loading_state(page)
        finally:
            browser.close()
