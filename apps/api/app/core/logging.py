import logging
import sys

def setup_logging(debug: bool = False):
    """Setup basic structured logging."""
    level = logging.DEBUG if debug else logging.INFO
    
    # Configure root logger
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logger = logging.getLogger("vayu")
    logger.setLevel(level)
    return logger

logger = logging.getLogger("vayu")
