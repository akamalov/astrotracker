"""Add oauth_account table

Revision ID: adcccfe29728
Revises: 5b817460df8a
Create Date: 2025-05-01 18:11:12.915472

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
# Remove unused dialect import
# from sqlalchemy.dialects import postgresql
# Remove unused fastapi_users import if present (might be added by autogen)
# import fastapi_users_db_sqlalchemy

# revision identifiers, used by Alembic.
revision: str = 'adcccfe29728'
down_revision: Union[str, None] = '5b817460df8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - adjusted ###
    op.create_table('oauth_account',
    # Use sa.UUID for consistency
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('oauth_name', sa.String(length=100), nullable=False),
    sa.Column('access_token', sa.String(length=1024), nullable=False),
    sa.Column('expires_at', sa.Integer(), nullable=True),
    sa.Column('refresh_token', sa.String(length=1024), nullable=True),
    sa.Column('account_id', sa.String(length=320), nullable=False),
    sa.Column('account_email', sa.String(length=320), nullable=False),
    # Use sa.UUID for consistency
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='cascade'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_oauth_account_account_id'), 'oauth_account', ['account_id'], unique=False)
    op.create_index(op.f('ix_oauth_account_oauth_name'), 'oauth_account', ['oauth_name'], unique=False)
    # --- REMOVE UNWANTED DROP COMMANDS ---
    # op.drop_index('ix_chart_birth_datetime', table_name='chart')
    # op.drop_index('ix_chart_city', table_name='chart')
    # op.drop_index('ix_chart_id', table_name='chart')
    # op.drop_index('ix_chart_location_name', table_name='chart')
    # op.drop_index('ix_chart_name', table_name='chart')
    # op.drop_index('ix_chart_user_id', table_name='chart')
    # op.drop_table('chart')
    # op.drop_index('ix_user_id', table_name='user')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - adjusted ###
    # --- REMOVE UNWANTED CREATE COMMANDS ---
    # op.create_index('ix_user_id', 'user', ['id'], unique=False)
    # op.create_table('chart', ... )
    # op.create_index('ix_chart_user_id', 'chart', ['user_id'], unique=False)
    # ... other chart indexes ...
    # --- Keep relevant drop commands ---
    op.drop_index(op.f('ix_oauth_account_oauth_name'), table_name='oauth_account')
    op.drop_index(op.f('ix_oauth_account_account_id'), table_name='oauth_account')
    op.drop_table('oauth_account')
    # ### end Alembic commands ###
