from playwright.sync_api import Page, expect, sync_playwright

def test_app_load(page: Page):
    # Navigate to the app
    page.goto("http://localhost:3000")

    # Expect the title to contain "Air Draw"
    expect(page).to_have_title("Air Draw")

    # Check for the main container
    expect(page.locator("text=AirDraw")).to_be_visible()

    # Check for the "Enable Camera" button
    expect(page.get_by_role("button", name="Enable Camera")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="verification/app_load.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_app_load(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
