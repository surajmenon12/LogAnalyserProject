class AnalysisError(Exception):
    """Raised when analysis workflow fails."""


class AIAnalysisError(AnalysisError):
    """Raised when AI API call fails."""


class WorkflowNotFoundError(Exception):
    """Raised when a workflow ID is not found."""
