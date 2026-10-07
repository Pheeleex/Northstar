"""Stable workspace identifier used by the simulated demo personas."""

from uuid import NAMESPACE_URL, uuid5


DEMO_WORKSPACE_ID = uuid5(NAMESPACE_URL, "northstar-demo:workspace:northstar-foods")
