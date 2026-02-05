from playwright.sync_api import Page, expect, sync_playwright
import time

def test_canvas_loads(page: Page):
    print("Navigating to app...")
    page.goto("http://localhost:3000")

    print("Waiting for page load...")
    # Wait for the 'Enable Camera' button to ensure app is loaded
    expect(page.get_by_role("button", name="Enable Camera")).to_be_visible()

    print("Checking for canvases...")
    # There should be 2 canvases (static and active)
    canvases = page.locator("canvas")
    expect(canvases).to_have_count(2)

    print("Checking static canvas opacity...")
    static_canvas = canvases.nth(0) # Static is z-10, first in DOM order in CanvasLayer return?
    # In CanvasLayer:
    # <canvas ref={staticCanvasRef} ... />
    # <canvas ref={activeCanvasRef} ... />
    # So first one is static.

    # Check if opacity is 1 (default) or not set (which means 1)
    # My change:
    # if (staticCanvasRef.current && prevIsErasingRef.current !== isErasing) {
    #   staticCanvasRef.current.style.opacity = isErasing ? '0' : '1';
    # }
    # Init: prev=false, isErasing=false. condition false. No style set.
    # So style.opacity should be empty string or 1 (computed).

    # Let's check computed style
    opacity = static_canvas.evaluate("el => getComputedStyle(el).opacity")
    print(f"Static canvas opacity: {opacity}")
    assert opacity == "1"

    print("Taking screenshot...")
    page.screenshot(path="verification/canvas_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_canvas_loads(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_screenshot.png")
            raise e
        finally:
            browser.close()
