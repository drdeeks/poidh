#!/usr/bin/env python3
"""
POIDH Autonomous Bounty Bot - Lightweight Python GUI
Complete standalone application for managing bounty agents
"""

import sys
import os
import json
import subprocess
import threading
import time
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTabWidget, QLabel, QLineEdit, QPushButton, QTextEdit, QComboBox,
    QSpinBox, QDoubleSpinBox, QCheckBox, QFileDialog, QMessageBox,
    QProgressBar, QTableWidget, QTableWidgetItem, QDialog, QFormLayout,
    QScrollArea, QFrame, QGroupBox
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QTimer, QProcess
from PyQt6.QtGui import QFont, QColor, QTextCursor, QIcon

from dotenv import load_dotenv, dotenv_values, set_key

# Get the root directory (parent of gui/)
ROOT_DIR = Path(__file__).parent.parent
GUI_DIR = Path(__file__).parent

# Ensure logs directory exists
LOGS_DIR = ROOT_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Environment file path
ENV_FILE = ROOT_DIR / '.env'


class WalletManager:
    """Manage wallet creation and balance checking"""
    
    @staticmethod
    def create_wallet() -> Optional[Dict[str, str]]:
        """Create a new wallet using npm"""
        try:
            result = subprocess.run(
                ['npm', 'run', 'wallet:create'],
                cwd=str(ROOT_DIR),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Parse output for wallet info
            output = result.stdout + result.stderr
            
            # Look for private key in output
            if '0x' in output:
                lines = output.split('\n')
                wallet_info = {'output': output}
                for line in lines:
                    if '0x' in line and len(line) > 60:
                        wallet_info['private_key'] = line.strip().split()[-1]
                    if 'Address:' in line or 'address:' in line.lower():
                        wallet_info['address'] = line.split(':')[-1].strip()
                
                return wallet_info if wallet_info.get('private_key') else None
            
            return None
        except Exception as e:
            return None
    
    @staticmethod
    def check_balance() -> Optional[Dict[str, Any]]:
        """Check wallet balance"""
        try:
            result = subprocess.run(
                ['npm', 'run', 'wallet:balance'],
                cwd=str(ROOT_DIR),
                capture_output=True,
                text=True,
                timeout=30
            )
            return {'output': result.stdout + result.stderr}
        except Exception as e:
            return {'error': str(e)}


class ConfigManager:
    """Manage .env configuration"""
    
    @staticmethod
    def load_config() -> Dict[str, str]:
        """Load current configuration"""
        if ENV_FILE.exists():
            return dotenv_values(ENV_FILE)
        return {}
    
    @staticmethod
    def save_config(config: Dict[str, str]) -> bool:
        """Save configuration to .env"""
        try:
            # Create or update .env file
            with open(ENV_FILE, 'w') as f:
                for key, value in config.items():
                    if value:
                        f.write(f'{key}={value}\n')
            return True
        except Exception as e:
            return False
    
    @staticmethod
    def update_config_value(key: str, value: str) -> bool:
        """Update a single config value"""
        try:
            set_key(str(ENV_FILE), key, value)
            return True
        except Exception as e:
            return False


class ProcessManager(QThread):
    """Manage npm processes in background"""
    
    output_signal = pyqtSignal(str)
    error_signal = pyqtSignal(str)
    finished_signal = pyqtSignal()
    
    def __init__(self, command: list, cwd: Path = ROOT_DIR):
        super().__init__()
        self.command = command
        self.cwd = cwd
        self.process = None
    
    def run(self):
        """Run npm command in thread"""
        try:
            self.process = subprocess.Popen(
                self.command,
                cwd=str(self.cwd),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Stream output
            for line in self.process.stdout:
                self.output_signal.emit(line.strip())
            
            # Wait for completion
            self.process.wait()
            
            if self.process.returncode != 0:
                stderr = self.process.stderr.read()
                if stderr:
                    self.error_signal.emit(stderr)
            
            self.finished_signal.emit()
        
        except Exception as e:
            self.error_signal.emit(str(e))
            self.finished_signal.emit()


class WalletTab(QWidget):
    """Wallet management tab"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Title
        title = QLabel('🔐 Wallet Management')
        title.setFont(QFont('Arial', 14, QFont.Weight.Bold))
        layout.addWidget(title)
        
        # Create Wallet Section
        create_group = QGroupBox('Create New Wallet')
        create_layout = QVBoxLayout()
        
        create_btn = QPushButton('Generate New Wallet')
        create_btn.clicked.connect(self.create_wallet)
        create_layout.addWidget(create_btn)
        
        self.wallet_output = QTextEdit()
        self.wallet_output.setReadOnly(True)
        self.wallet_output.setFont(QFont('Courier', 10))
        create_layout.addWidget(QLabel('Generated Wallet:'))
        create_layout.addWidget(self.wallet_output)
        
        copy_btn = QPushButton('Copy Private Key to Clipboard')
        copy_btn.clicked.connect(self.copy_private_key)
        create_layout.addWidget(copy_btn)
        
        create_group.setLayout(create_layout)
        layout.addWidget(create_group)
        
        # Balance Section
        balance_group = QGroupBox('Check Balance')
        balance_layout = QVBoxLayout()
        
        check_btn = QPushButton('Check Wallet Balance')
        check_btn.clicked.connect(self.check_balance)
        balance_layout.addWidget(check_btn)
        
        self.balance_output = QTextEdit()
        self.balance_output.setReadOnly(True)
        self.balance_output.setFont(QFont('Courier', 10))
        balance_layout.addWidget(QLabel('Balance Info:'))
        balance_layout.addWidget(self.balance_output)
        
        balance_group.setLayout(balance_layout)
        layout.addWidget(balance_group)
        
        # Import Wallet Section
        import_group = QGroupBox('Import Existing Wallet')
        import_layout = QVBoxLayout()
        
        import_form = QFormLayout()
        self.import_pk_input = QLineEdit()
        self.import_pk_input.setPlaceholderText('0x...')
        import_form.addRow('Private Key:', self.import_pk_input)
        
        import_btn = QPushButton('Import & Save')
        import_btn.clicked.connect(self.import_wallet)
        import_form.addRow(import_btn)
        
        import_layout.addLayout(import_form)
        import_group.setLayout(import_layout)
        layout.addWidget(import_group)
        
        layout.addStretch()
        self.setLayout(layout)
    
    def create_wallet(self):
        """Create a new wallet"""
        self.wallet_output.setText('Generating wallet...')
        QApplication.processEvents()
        
        wallet = WalletManager.create_wallet()
        if wallet:
            self.wallet_output.setText(wallet.get('output', 'Wallet created'))
        else:
            self.wallet_output.setText('Failed to create wallet. Check Node.js installation.')
    
    def check_balance(self):
        """Check wallet balance"""
        self.balance_output.setText('Checking balance...')
        QApplication.processEvents()
        
        result = WalletManager.check_balance()
        if result:
            self.balance_output.setText(result.get('output', result.get('error', 'Unknown error')))
        else:
            self.balance_output.setText('Failed to check balance.')
    
    def copy_private_key(self):
        """Copy private key to clipboard"""
        text = self.wallet_output.toPlainText()
        if '0x' in text:
            # Extract private key
            for line in text.split('\n'):
                if '0x' in line and len(line) > 60:
                    pk = line.strip().split()[-1]
                    QApplication.clipboard().setText(pk)
                    QMessageBox.information(self, 'Copied', 'Private key copied to clipboard!')
                    return
        QMessageBox.warning(self, 'Error', 'No private key found in output.')
    
    def import_wallet(self):
        """Import and save wallet"""
        pk = self.import_pk_input.text().strip()
        
        if not pk.startswith('0x') or len(pk) != 66:
            QMessageBox.warning(self, 'Invalid', 'Private key must be 66 characters starting with 0x')
            return
        
        if ConfigManager.update_config_value('BOT_PRIVATE_KEY', pk):
            QMessageBox.information(self, 'Success', 'Wallet imported and saved to .env')
            self.import_pk_input.clear()
        else:
            QMessageBox.critical(self, 'Error', 'Failed to save wallet.')


class ConfigTab(QWidget):
    """Configuration management tab"""
    
    def __init__(self):
        super().__init__()
        self.config = ConfigManager.load_config()
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        title = QLabel('⚙️ Configuration')
        title.setFont(QFont('Arial', 14, QFont.Weight.Bold))
        layout.addWidget(title)
        
        # Scroll area for many config options
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        
        scroll_widget = QWidget()
        form_layout = QFormLayout()
        
        # Chain Configuration
        chain_group = QGroupBox('Blockchain Configuration')
        chain_layout = QFormLayout()
        
        self.chain_id_combo = QComboBox()
        self.chain_id_combo.addItems(['8453 (Base Mainnet)', '42161 (Arbitrum One)', '666666666 (Degen)'])
        chain_layout.addRow('Primary Chain:', self.chain_id_combo)
        
        self.supported_chains_input = QLineEdit()
        self.supported_chains_input.setText(self.config.get('SUPPORTED_CHAINS', '8453,42161,666666666'))
        chain_layout.addRow('Supported Chains (comma-separated):', self.supported_chains_input)
        
        chain_group.setLayout(chain_layout)
        form_layout.addRow(chain_group)
        
        # RPC Configuration
        rpc_group = QGroupBox('RPC Endpoints')
        rpc_layout = QFormLayout()
        
        self.base_rpc_input = QLineEdit()
        self.base_rpc_input.setText(self.config.get('BASE_RPC_URL', 'https://mainnet.base.org'))
        rpc_layout.addRow('Base RPC:', self.base_rpc_input)
        
        self.arbitrum_rpc_input = QLineEdit()
        self.arbitrum_rpc_input.setText(self.config.get('ARBITRUM_RPC_URL', 'https://arb1.arbitrum.io/rpc'))
        rpc_layout.addRow('Arbitrum RPC:', self.arbitrum_rpc_input)
        
        self.degen_rpc_input = QLineEdit()
        self.degen_rpc_input.setText(self.config.get('DEGEN_RPC_URL', 'https://rpc.degen.tips'))
        rpc_layout.addRow('Degen RPC:', self.degen_rpc_input)
        
        rpc_group.setLayout(rpc_layout)
        form_layout.addRow(rpc_group)
        
        # AI Configuration
        ai_group = QGroupBox('AI Configuration')
        ai_layout = QFormLayout()
        
        self.openai_key_input = QLineEdit()
        self.openai_key_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.openai_key_input.setText(self.config.get('OPENAI_API_KEY', ''))
        ai_layout.addRow('OpenAI API Key:', self.openai_key_input)
        
        self.openai_model_combo = QComboBox()
        self.openai_model_combo.addItems(['gpt-4o', 'gpt-4-turbo'])
        current_model = self.config.get('OPENAI_VISION_MODEL', 'gpt-4o')
        self.openai_model_combo.setCurrentText(current_model)
        ai_layout.addRow('Vision Model:', self.openai_model_combo)
        
        ai_group.setLayout(ai_layout)
        form_layout.addRow(ai_group)
        
        # Performance Configuration
        perf_group = QGroupBox('Performance')
        perf_layout = QFormLayout()
        
        self.polling_interval = QSpinBox()
        self.polling_interval.setRange(5, 300)
        self.polling_interval.setValue(int(self.config.get('POLLING_INTERVAL', '30')))
        perf_layout.addRow('Polling Interval (seconds):', self.polling_interval)
        
        self.max_gas_price = QDoubleSpinBox()
        self.max_gas_price.setRange(0, 1000)
        self.max_gas_price.setValue(float(self.config.get('MAX_GAS_PRICE_GWEI', '50')))
        perf_layout.addRow('Max Gas Price (gwei):', self.max_gas_price)
        
        self.stream_port = QSpinBox()
        self.stream_port.setRange(1024, 65535)
        self.stream_port.setValue(int(self.config.get('STREAMING_PORT', '3001')))
        perf_layout.addRow('Dashboard Port:', self.stream_port)
        
        perf_group.setLayout(perf_layout)
        form_layout.addRow(perf_group)
        
        # Logging Configuration
        log_group = QGroupBox('Logging')
        log_layout = QFormLayout()
        
        self.log_level_combo = QComboBox()
        self.log_level_combo.addItems(['debug', 'info', 'warn', 'error'])
        self.log_level_combo.setCurrentText(self.config.get('LOG_LEVEL', 'info'))
        log_layout.addRow('Log Level:', self.log_level_combo)
        
        self.demo_mode_check = QCheckBox('Demo Mode (no real transactions)')
        self.demo_mode_check.setChecked(self.config.get('DEMO_MODE', 'false').lower() == 'true')
        log_layout.addRow('Options:', self.demo_mode_check)
        
        log_group.setLayout(log_layout)
        form_layout.addRow(log_group)
        
        scroll_widget.setLayout(form_layout)
        scroll.setWidget(scroll_widget)
        layout.addWidget(scroll)
        
        # Save Button
        save_btn = QPushButton('💾 Save Configuration')
        save_btn.setFont(QFont('Arial', 11, QFont.Weight.Bold))
        save_btn.clicked.connect(self.save_config)
        layout.addWidget(save_btn)
        
        self.setLayout(layout)
    
    def save_config(self):
        """Save configuration to .env"""
        config = {
            'SUPPORTED_CHAINS': self.supported_chains_input.text(),
            'BASE_RPC_URL': self.base_rpc_input.text(),
            'ARBITRUM_RPC_URL': self.arbitrum_rpc_input.text(),
            'DEGEN_RPC_URL': self.degen_rpc_input.text(),
            'OPENAI_API_KEY': self.openai_key_input.text(),
            'OPENAI_VISION_MODEL': self.openai_model_combo.currentText(),
            'POLLING_INTERVAL': str(self.polling_interval.value()),
            'MAX_GAS_PRICE_GWEI': str(self.max_gas_price.value()),
            'STREAMING_PORT': str(self.stream_port.value()),
            'LOG_LEVEL': self.log_level_combo.currentText(),
            'DEMO_MODE': 'true' if self.demo_mode_check.isChecked() else 'false',
        }
        
        if ConfigManager.save_config(config):
            QMessageBox.information(self, 'Success', 'Configuration saved!')
        else:
            QMessageBox.critical(self, 'Error', 'Failed to save configuration.')


class AgentTab(QWidget):
    """Agent creation and management tab"""
    
    def __init__(self):
        super().__init__()
        self.process_manager = None
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        title = QLabel('🤖 Agent Management')
        title.setFont(QFont('Arial', 14, QFont.Weight.Bold))
        layout.addWidget(title)
        
        # Quick Start
        quick_group = QGroupBox('Quick Start - Pre-built Bounties')
        quick_layout = QVBoxLayout()
        
        buttons_layout = QVBoxLayout()
        bounties = [
            ('🌳 Prove Outside', 'agent:outside'),
            ('📝 Handwritten Date', 'agent:handwritten'),
            ('🍽️ Meal Photo', 'agent:meal'),
            ('🗼 Object Tower (AI)', 'agent:tower'),
            ('🌗 Shadow Art (AI)', 'agent:shadow'),
            ('🐾 Animal Photo (AI)', 'agent:animal'),
        ]
        
        for label, command in bounties:
            btn = QPushButton(label)
            btn.clicked.connect(lambda checked, cmd=command: self.create_bounty(cmd))
            buttons_layout.addWidget(btn)
        
        quick_layout.addLayout(buttons_layout)
        quick_group.setLayout(quick_layout)
        layout.addWidget(quick_group)
        
        # Custom Bounty
        custom_group = QGroupBox('Custom Bounty')
        custom_layout = QFormLayout()
        
        self.custom_name = QLineEdit()
        self.custom_name.setPlaceholderText('e.g., Best Sunset Photo')
        custom_layout.addRow('Bounty Name:', self.custom_name)
        
        self.custom_desc = QLineEdit()
        self.custom_desc.setPlaceholderText('Description...')
        custom_layout.addRow('Description:', self.custom_desc)
        
        self.custom_reward = QDoubleSpinBox()
        self.custom_reward.setRange(0.001, 1000)
        self.custom_reward.setValue(1.0)
        custom_layout.addRow('Reward (ETH/DEGEN):', self.custom_reward)
        
        self.custom_chain = QComboBox()
        self.custom_chain.addItems(['base', 'arbitrum', 'degen'])
        custom_layout.addRow('Chain:', self.custom_chain)
        
        custom_btn = QPushButton('Create Custom Bounty')
        custom_btn.clicked.connect(self.create_custom_bounty)
        custom_layout.addRow(custom_btn)
        
        custom_group.setLayout(custom_layout)
        layout.addWidget(custom_group)
        
        # Monitor
        monitor_group = QGroupBox('Monitor')
        monitor_layout = QVBoxLayout()
        
        monitor_btn = QPushButton('🔍 Start Monitoring Bounties')
        monitor_btn.clicked.connect(self.start_monitor)
        monitor_layout.addWidget(monitor_btn)
        
        monitor_group.setLayout(monitor_layout)
        layout.addWidget(monitor_group)
        
        # Output
        self.output_text = QTextEdit()
        self.output_text.setReadOnly(True)
        self.output_text.setFont(QFont('Courier', 9))
        layout.addWidget(QLabel('Output:'))
        layout.addWidget(self.output_text)
        
        self.setLayout(layout)
    
    def create_bounty(self, command: str):
        """Create a bounty"""
        self.output_text.clear()
        self.run_npm_command(['npm', 'run', command])
    
    def create_custom_bounty(self):
        """Create custom bounty"""
        # This would require more complex implementation
        QMessageBox.information(self, 'Info', 'Custom bounty creation requires editing config file.\nSee documentation for details.')
    
    def start_monitor(self):
        """Start monitoring"""
        self.output_text.clear()
        self.run_npm_command(['npm', 'run', 'agent:monitor'])
    
    def run_npm_command(self, command: list):
        """Run npm command"""
        self.output_text.setText(f'Running: {" ".join(command)}...\n')
        
        self.process_manager = ProcessManager(command)
        self.process_manager.output_signal.connect(self.append_output)
        self.process_manager.error_signal.connect(self.append_error)
        self.process_manager.finished_signal.connect(self.on_process_finished)
        self.process_manager.start()
    
    def append_output(self, text: str):
        """Append output to text area"""
        self.output_text.append(text)
        # Auto-scroll to bottom
        cursor = self.output_text.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        self.output_text.setTextCursor(cursor)
    
    def append_error(self, text: str):
        """Append error to text area"""
        self.output_text.append(f'❌ Error: {text}')
    
    def on_process_finished(self):
        """Called when process finishes"""
        self.output_text.append('\n✅ Process completed.')


class DashboardTab(QWidget):
    """Dashboard and logging tab"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.start_log_monitoring()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        title = QLabel('📊 Dashboard & Logs')
        title.setFont(QFont('Arial', 14, QFont.Weight.Bold))
        layout.addWidget(title)
        
        # Control buttons
        ctrl_layout = QHBoxLayout()
        
        open_dashboard_btn = QPushButton('🌐 Open Dashboard')
        open_dashboard_btn.clicked.connect(self.open_dashboard)
        ctrl_layout.addWidget(open_dashboard_btn)
        
        refresh_logs_btn = QPushButton('🔄 Refresh Logs')
        refresh_logs_btn.clicked.connect(self.refresh_logs)
        ctrl_layout.addWidget(refresh_logs_btn)
        
        clear_logs_btn = QPushButton('🗑️ Clear Display')
        clear_logs_btn.clicked.connect(self.clear_logs)
        ctrl_layout.addWidget(clear_logs_btn)
        
        layout.addLayout(ctrl_layout)
        
        # Logs display
        self.logs_text = QTextEdit()
        self.logs_text.setReadOnly(True)
        self.logs_text.setFont(QFont('Courier', 9))
        layout.addWidget(QLabel('Real-time Logs:'))
        layout.addWidget(self.logs_text)
        
        # Audit trail
        self.audit_text = QTextEdit()
        self.audit_text.setReadOnly(True)
        self.audit_text.setFont(QFont('Courier', 8))
        layout.addWidget(QLabel('Audit Trail:'))
        layout.addWidget(self.audit_text)
        
        self.setLayout(layout)
    
    def start_log_monitoring(self):
        """Start monitoring logs"""
        self.log_timer = QTimer()
        self.log_timer.timeout.connect(self.refresh_logs)
        self.log_timer.start(2000)  # Update every 2 seconds
    
    def refresh_logs(self):
        """Refresh logs from file"""
        try:
            bot_log = LOGS_DIR / 'bot.log'
            if bot_log.exists():
                with open(bot_log, 'r') as f:
                    content = f.readlines()[-50:]  # Last 50 lines
                    self.logs_text.setPlainText(''.join(content))
            
            audit_log = LOGS_DIR / 'audit-trail.txt'
            if audit_log.exists():
                with open(audit_log, 'r') as f:
                    content = f.readlines()[-30:]  # Last 30 lines
                    self.audit_text.setPlainText(''.join(content))
        except Exception as e:
            self.logs_text.setText(f'Error reading logs: {e}')
    
    def clear_logs(self):
        """Clear log displays"""
        self.logs_text.clear()
        self.audit_text.clear()
    
    def open_dashboard(self):
        """Open dashboard in browser"""
        try:
            import webbrowser
            webbrowser.open('http://localhost:3001')
        except Exception as e:
            QMessageBox.warning(self, 'Error', f'Failed to open dashboard: {e}')


class MainWindow(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle('🤖 POIDH Autonomous Bounty Bot')
        self.setGeometry(100, 100, 1200, 800)
        
        self.init_ui()
        self.load_config_display()
    
    def init_ui(self):
        """Initialize UI"""
        # Create central widget
        central = QWidget()
        layout = QVBoxLayout()
        
        # Header
        header = QLabel('POIDH Autonomous Bounty Bot - Control Panel')
        header.setFont(QFont('Arial', 16, QFont.Weight.Bold))
        header.setStyleSheet('color: #2E86AB; padding: 10px;')
        layout.addWidget(header)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.addTab(WalletTab(), '💰 Wallet')
        self.tabs.addTab(ConfigTab(), '⚙️ Configuration')
        self.tabs.addTab(AgentTab(), '🤖 Agent')
        self.tabs.addTab(DashboardTab(), '📊 Dashboard')
        
        layout.addWidget(self.tabs)
        
        # Status bar
        self.statusBar().showMessage('Ready')
        
        central.setLayout(layout)
        self.setCentralWidget(central)
    
    def load_config_display(self):
        """Load configuration into display"""
        config = ConfigManager.load_config()
        if config.get('BOT_PRIVATE_KEY'):
            self.statusBar().showMessage('✅ Wallet configured | Ready to run')
        else:
            self.statusBar().showMessage('⚠️ Wallet not configured. Generate or import a wallet.')


def main():
    """Main entry point"""
    app = QApplication(sys.argv)
    
    # Set application style
    app.setStyle('Fusion')
    
    # Create and show window
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())


if __name__ == '__main__':
    main()
