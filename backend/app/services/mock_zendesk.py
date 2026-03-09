import logging
import random
import uuid

logger = logging.getLogger(__name__)


async def update_zendesk_ticket(
    ticket_id: str, summary: str
) -> dict:
    """Mock Zendesk API — returns a fake success response."""
    logger.info(f"Mock Zendesk: Updating ticket {ticket_id}")

    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": f"Ticket {ticket_id} updated with analysis summary. Internal note ID: {uuid.uuid4().hex[:8]}",
    }
