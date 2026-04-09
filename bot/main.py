"""EarnRebalancer Telegram Bot entry point."""
import logging

from telegram import Update
from telegram.ext import Application, CommandHandler

from config import TELEGRAM_BOT_TOKEN
from handlers.start import start
from handlers.positions import positions
from handlers.recommend import recommend
from handlers.execute import execute

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def main() -> None:
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("positions", positions))
    app.add_handler(CommandHandler("recommend", recommend))
    app.add_handler(CommandHandler("execute", execute))

    logger.info("Bot started. Polling for updates…")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
