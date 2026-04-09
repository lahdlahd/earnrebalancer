"""Shared configuration loaded from environment variables."""
import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN: str = os.environ["TELEGRAM_BOT_TOKEN"]
EARN_BASE_URL: str = os.getenv("EARN_BASE_URL", "https://earn.li.fi")
LIFI_BASE_URL: str = os.getenv("LIFI_BASE_URL", "https://li.quest")
LIFI_API_KEY: str = os.getenv("LIFI_API_KEY", "")
WEB_APP_URL: str = os.getenv("WEB_APP_URL", "")
