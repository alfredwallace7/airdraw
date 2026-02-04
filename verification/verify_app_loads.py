from playwright.sync_api import sync_playwright, expect

def test_app_loads(page):
    page.goto("http://localhost:3000")

    # Check for title or main element
    # App.tsx has "AirDraw" text
    expect(page.get_by_text("AirDraw")).to_be_visible()

    # Check if Enable Camera button is visible
    expect(page.get_by_text("Enable Camera")).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification/app_loaded.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_app_loads(page)
        finally:
            browser.close()
