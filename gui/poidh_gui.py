#!/usr/bin/env python3
"""
POIDH Autonomous Bounty Bot - GUI Application
Lightweight PyQt5 interface for wallet management, agent control, and real-time monitoring
"""

import sys
import json
import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTabWidget, QLabel, QLineEdit, QPushButton, QTextEdit, QComboBox,
    QSpinBox, QDoubleSpinBox, QCheckBox, QDialog, QMessageBox,
    QProgressBar, QTableWidget, QTableWidgetItem, QFileDialog,
    QGroupBox, QFormLayout, QListWidget, QListWidgetItem, QStatusBar
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QTimer, QProcess
from PyQt5.QtGui import QFont, QColor, QIcon, QPixmap
import requests
from dotenv import load_dotenv, set_key


class ProcessManager(QThread):
    """Background process runner for Node.js agent"""
    output_signal = pyqtSignal(str)
    error_signal = pyqtSignal(str)
    finished_signal = pyqtSignal(int)
    
    def __init__(self, command: str, cwd: str):
        super().__init__()
        self.command = command
        self.cwd = cwd
        self.process: Optional[subprocess.Popen] = None
        self.running = True
    
    def run(self):
        try:
            self.process = subprocess.Popen(
                self.command,
                shell=True,
                cwd=self.cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            for line in iter(self.process.stdout.readline, ''):
                if not self.running:
                    break
                if line:
                    self.output_signal.emit(line.rstrip())
            
            if self.process:
                returncode = self.process.wait()
                self.finished_signal.emit(returncode)
        except Exception as e:
            self.error_signal.emit(f"Error: {str(e)}")
            self.finished_signal.emit(-1)
    
    def stop(self):
        self.running = False
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except:
                self.process.kill()


class WalletTab(QWidget):
    """Wallet management interface"""
    
    def __init__(self, project_root: str):
        super().__init__()
        self.project_root = project_root
        self.env_file = Path(project_root) / '.env'
        self.init_ui()
        self.load_wallet_info()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Wallet Info Section
        info_group = QGroupBox("Wallet Information")
        info_layout = QFormLayout()
        
        self.address_label = QLabel("Not loaded")
        self.address_label.setFont(QFont("Courier", 9))
        self.balance_label = QLabel("--")
        self.balance_label.setFont(QFont("Courier", 10, QFont.Bold))
        self.network_label = QLabel("--")
        
        info_layout.addRow("Address:", self.address_label)
        info_layout.addRow("Balance:", self.balance_label)
        info_layout.addRow("Network:", self.network_label)
        info_group.setLayout(info_layout)
        layout.addWidget(info_group)
        
        # Wallet Actions
        actions_group = QGroupBox("Wallet Actions")
        actions_layout = QVBoxLayout()
        
        btn_generate = QPushButton("Generate New Wallet")
        btn_generate.clicked.connect(self.generate_wallet)
        
        btn_import = QPushButton("Import from Private Key")
        btn_import.clicked.connect(self.import_wallet)
        
        btn_refresh = QPushButton("Refresh Balance")
        btn_refresh.clicked.connect(self.load_wallet_info)
        
        actions_layout.addWidget(btn_generate)
        actions_layout.addWidget(btn_import)
        actions_layout.addWidget(btn_refresh)
        actions_group.setLayout(actions_layout)
        layout.addWidget(actions_group)
        
        # Log
        self.log = QTextEdit()
        self.log.setReadOnly(True)
        self.log.setFont(QFont("Courier", 9))
        layout.addWidget(QLabel("Log:"))
        layout.addWidget(self.log)
        
        self.setLayout(layout)
    
    def load_wallet_info(self):
        """Load wallet info from environment and check balance"""
        try:
            load_dotenv(self.env_file)
            private_key = os.getenv('BOT_PRIVATE_KEY', '')
            chain_id = int(os.getenv('CHAIN_ID', '8453'))
            
            if private_key and private_key != '0x':
                # Display partial address
                self.address_label.setText(f"0x...{private_key[-8:]}")
                self.log_message("✅ Wallet loaded")
                
                # Get chain name
                chain_names = {
                    8453: "Base Mainnet",
                    84532: "Base Sepolia",
                    42161: "Arbitrum One",
                    421614: "Arbitrum Sepolia",
                    666666666: "Degen",
                    1: "Ethereum",
                    11155111: "Sepolia"
                }
                self.network_label.setText(chain_names.get(chain_id, f"Chain {chain_id}"))
                
                # Try to fetch balance via Node.js script
                self.fetch_balance()
            else:
                self.address_label.setText("No wallet configured")
                self.balance_label.setText("--")
                self.log_message("⚠️ No wallet found. Generate or import one.")
        except Exception as e:
            self.log_message(f"❌ Error loading wallet: {e}")
    
    def fetch_balance(self):
        """Fetch wallet balance by running Node.js script"""
        try:
            result = subprocess.run(
                "npm run wallet:balance",
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Parse output for balance
            for line in result.stdout.split('\n'):
                if 'balance' in line.lower() or 'eth' in line.lower():
                    self.balance_label.setText(line.strip())
                    self.log_message(f"💰 {line.strip()}")
        except subprocess.TimeoutExpired:
            self.log_message("⏱️ Timeout fetching balance")
        except Exception as e:
            self.log_message(f"⚠️ Could not fetch balance: {e}")
    
    def generate_wallet(self):
        """Generate new wallet"""
        try:
            result = subprocess.run(
                "npm run wallet:create",
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=15
            )
            
            self.log.setText(result.stdout)
            self.log_message("✅ Wallet generated! Stored in .env")
            
            # Reload
            time.sleep(1)
            self.load_wallet_info()
        except Exception as e:
            self.log_message(f"❌ Error: {e}")
    
    def import_wallet(self):
        """Import wallet from private key"""
        dialog = QDialog(self)
        dialog.setWindowTitle("Import Wallet")
        layout = QVBoxLayout()
        
        layout.addWidget(QLabel("Private Key (0x...)"))
        pk_input = QLineEdit()
        pk_input.setEchoMode(QLineEdit.Password)
        layout.addWidget(pk_input)
        
        def save_pk():
            pk = pk_input.text().strip()
            if not pk.startswith('0x') or len(pk) != 66:
                QMessageBox.warning(dialog, "Invalid", "Private key must be 0x + 64 hex chars")
                return
            
            try:
                set_key(str(self.env_file), 'BOT_PRIVATE_KEY', pk)
                QMessageBox.information(dialog, "Success", "Wallet imported!")
                dialog.close()
                self.load_wallet_info()
            except Exception as e:
                QMessageBox.critical(dialog, "Error", f"Failed: {e}")
        
        btn = QPushButton("Import")
        btn.clicked.connect(save_pk)
        layout.addWidget(btn)
        
        dialog.setLayout(layout)
        dialog.exec_()
    
    def log_message(self, msg: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log.append(f"[{timestamp}] {msg}")


class ConfigTab(QWidget):
    """Configuration panel"""
    
    def __init__(self, project_root: str):
        super().__init__()
        self.project_root = project_root
        self.env_file = Path(project_root) / '.env'
        self.configs: Dict[str, QLineEdit] = {}
        self.init_ui()
        self.load_config()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Chain Selection
        chain_group = QGroupBox("Blockchain Configuration")
        chain_layout = QFormLayout()
        
        self.chain_combo = QComboBox()
        self.chain_combo.addItems([
            "Base Mainnet (8453)",
            "Base Sepolia (84532)",
            "Arbitrum One (42161)",
            "Arbitrum Sepolia (421614)",
            "Degen (666666666)"
        ])
        self.chain_combo.currentIndexChanged.connect(self.on_chain_changed)
        chain_layout.addRow("Chain:", self.chain_combo)
        
        self.rpc_input = QLineEdit()
        chain_layout.addRow("RPC URL:", self.rpc_input)
        chain_group.setLayout(chain_layout)
        layout.addWidget(chain_group)
        
        # API Keys
        api_group = QGroupBox("API Configuration")
        api_layout = QFormLayout()
        
        self.openai_input = QLineEdit()
        self.openai_input.setEchoMode(QLineEdit.Password)
        api_layout.addRow("OpenAI API Key:", self.openai_input)
        
        self.alchemy_input = QLineEdit()
        self.alchemy_input.setEchoMode(QLineEdit.Password)
        api_layout.addRow("Alchemy Key (optional):", self.alchemy_input)
        
        api_group.setLayout(api_layout)
        layout.addWidget(api_group)
        
        # Agent Settings
        agent_group = QGroupBox("Agent Settings")
        agent_layout = QFormLayout()
        
        self.polling_input = QSpinBox()
        self.polling_input.setMinimum(5)
        self.polling_input.setMaximum(300)
        self.polling_input.setValue(30)
        agent_layout.addRow("Polling Interval (s):", self.polling_input)
        
        self.max_gas_input = QSpinBox()
        self.max_gas_input.setMinimum(1)
        self.max_gas_input.setMaximum(500)
        self.max_gas_input.setValue(50)
        agent_layout.addRow("Max Gas Price (Gwei):", self.max_gas_input)
        
        self.auto_approve = QCheckBox("Auto-approve transactions")
        self.auto_approve.setChecked(True)
        agent_layout.addRow("", self.auto_approve)
        
        agent_group.setLayout(agent_layout)
        layout.addWidget(agent_group)
        
        # Save button
        save_btn = QPushButton("Save Configuration")
        save_btn.clicked.connect(self.save_config)
        layout.addWidget(save_btn)
        
        layout.addStretch()
        self.setLayout(layout)
    
    def load_config(self):
        """Load configuration from .env"""
        try:
            load_dotenv(self.env_file)
            
            chain_id = int(os.getenv('CHAIN_ID', '8453'))
            chain_map = {
                8453: 0,
                84532: 1,
                42161: 2,
                421614: 3,
                666666666: 4
            }
            self.chain_combo.setCurrentIndex(chain_map.get(chain_id, 0))
            
            self.rpc_input.setText(os.getenv('BASE_RPC_URL', ''))
            self.openai_input.setText(os.getenv('OPENAI_API_KEY', ''))
            self.alchemy_input.setText(os.getenv('ALCHEMY_KEY', ''))
            
            self.polling_input.setValue(int(os.getenv('POLLING_INTERVAL', '30')))
            self.max_gas_input.setValue(int(os.getenv('MAX_GAS_PRICE_GWEI', '50')))
            self.auto_approve.setChecked(os.getenv('AUTO_APPROVE_GAS', 'true').lower() == 'true')
        except Exception as e:
            print(f"Error loading config: {e}")
    
    def on_chain_changed(self):
        """Update RPC URL based on selected chain"""
        chain_ids = ['8453', '84532', '42161', '421614', '666666666']
        chain_names = ['base', 'base-sepolia', 'arbitrum', 'arbitrum-sepolia', 'degen']
        idx = self.chain_combo.currentIndex()
        
        if idx < len(chain_ids):
            chain_id = chain_ids[idx]
            chain_name = chain_names[idx]
            set_key(str(self.env_file), 'CHAIN_ID', chain_id)
    
    def save_config(self):
        """Save configuration to .env"""
        try:
            chain_ids = ['8453', '84532', '42161', '421614', '666666666']
            chain_id = chain_ids[self.chain_combo.currentIndex()]
            
            set_key(str(self.env_file), 'CHAIN_ID', chain_id)
            
            if self.rpc_input.text():
                set_key(str(self.env_file), 'BASE_RPC_URL', self.rpc_input.text())
            
            if self.openai_input.text():
                set_key(str(self.env_file), 'OPENAI_API_KEY', self.openai_input.text())
            
            if self.alchemy_input.text():
                set_key(str(self.env_file), 'ALCHEMY_KEY', self.alchemy_input.text())
            
            set_key(str(self.env_file), 'POLLING_INTERVAL', str(self.polling_input.value()))
            set_key(str(self.env_file), 'MAX_GAS_PRICE_GWEI', str(self.max_gas_input.value()))
            set_key(str(self.env_file), 'AUTO_APPROVE_GAS', 'true' if self.auto_approve.isChecked() else 'false')
            
            QMessageBox.information(self, "Success", "Configuration saved!")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to save: {e}")


class BountyTab(QWidget):
    """Bounty creation and management"""
    
    def __init__(self, project_root: str):
        super().__init__()
        self.project_root = project_root
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Template Selection
        template_group = QGroupBox("Select Bounty Template")
        template_layout = QVBoxLayout()
        
        self.template_combo = QComboBox()
        templates = [
            ("Prove You're Outside", "proveOutside"),
            ("Handwritten Date", "handwrittenDate"),
            ("Meal Photo", "mealPhoto"),
            ("Object Tower", "objectTower"),
            ("Shadow Art", "shadowArt"),
            ("Animal Photo", "animalPhoto"),
        ]
        for name, cmd in templates:
            self.template_combo.addItem(name, cmd)
        
        template_layout.addWidget(QLabel("Choose a bounty type:"))
        template_layout.addWidget(self.template_combo)
        template_group.setLayout(template_layout)
        layout.addWidget(template_group)
        
        # Custom Bounty
        custom_group = QGroupBox("Custom Bounty (Optional)")
        custom_layout = QFormLayout()
        
        self.custom_name = QLineEdit()
        custom_layout.addRow("Name:", self.custom_name)
        
        self.custom_desc = QLineEdit()
        custom_layout.addRow("Description:", self.custom_desc)
        
        self.custom_reward = QDoubleSpinBox()
        self.custom_reward.setMinimum(0.0001)
        self.custom_reward.setMaximum(100)
        self.custom_reward.setValue(0.001)
        custom_layout.addRow("Reward (ETH):", self.custom_reward)
        
        self.custom_hours = QSpinBox()
        self.custom_hours.setMinimum(1)
        self.custom_hours.setMaximum(720)
        self.custom_hours.setValue(24)
        custom_layout.addRow("Duration (hours):", self.custom_hours)
        
        custom_group.setLayout(custom_layout)
        layout.addWidget(custom_group)
        
        # Reward Override
        reward_group = QGroupBox("Reward Override")
        reward_layout = QFormLayout()
        
        self.override_reward = QDoubleSpinBox()
        self.override_reward.setMinimum(0.0001)
        self.override_reward.setMaximum(100)
        self.override_reward.setValue(0.001)
        self.override_reward.setEnabled(False)
        reward_layout.addRow("Override Amount:", self.override_reward)
        
        self.use_override = QCheckBox("Use custom reward")
        self.use_override.toggled.connect(self.override_reward.setEnabled)
        reward_layout.addRow("", self.use_override)
        
        reward_group.setLayout(reward_layout)
        layout.addWidget(reward_group)
        
        # Launch button
        launch_btn = QPushButton("Launch Bounty")
        launch_btn.setFont(QFont("Arial", 12, QFont.Bold))
        launch_btn.setStyleSheet("background-color: #4CAF50; color: white; padding: 10px;")
        launch_btn.clicked.connect(self.launch_bounty)
        layout.addWidget(launch_btn)
        
        # Log
        self.log = QTextEdit()
        self.log.setReadOnly(True)
        self.log.setFont(QFont("Courier", 9))
        layout.addWidget(QLabel("Launch Log:"))
        layout.addWidget(self.log)
        
        self.setLayout(layout)
    
    def launch_bounty(self):
        """Launch selected bounty"""
        self.log.clear()
        
        template = self.template_combo.currentData()
        reward = f" -- --reward {self.override_reward.value()}" if self.use_override.isChecked() else ""
        
        cmd = f"npm run agent {template}{reward}"
        
        self.log_message(f"🚀 Launching: {cmd}")
        self.log_message("-" * 60)
        
        self.process = ProcessManager(cmd, self.project_root)
        self.process.output_signal.connect(self.log_message)
        self.process.error_signal.connect(self.log_error)
        self.process.finished_signal.connect(self.on_process_finished)
        self.process.start()
    
    def log_message(self, msg: str):
        self.log.append(msg)
        self.log.verticalScrollBar().setValue(
            self.log.verticalScrollBar().maximum()
        )
    
    def log_error(self, msg: str):
        self.log.append(f"❌ {msg}")
    
    def on_process_finished(self, code: int):
        status = "✅ Success" if code == 0 else f"❌ Failed (code {code})"
        self.log_message(f"\n{status}")


class MonitorTab(QWidget):
    """Real-time monitoring"""
    
    def __init__(self, project_root: str):
        super().__init__()
        self.project_root = project_root
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Status
        status_group = QGroupBox("Agent Status")
        status_layout = QVBoxLayout()
        
        self.status_label = QLabel("🔴 Offline")
        self.status_label.setFont(QFont("Arial", 12, QFont.Bold))
        status_layout.addWidget(self.status_label)
        
        status_group.setLayout(status_layout)
        layout.addWidget(status_group)
        
        # Live Log
        log_group = QGroupBox("Audit Trail (Real-time)")
        log_layout = QVBoxLayout()
        
        self.log_list = QListWidget()
        self.log_list.setFont(QFont("Courier", 9))
        log_layout.addWidget(self.log_list)
        
        btn_clear = QPushButton("Clear")
        btn_clear.clicked.connect(self.log_list.clear)
        btn_clear.setMaximumWidth(100)
        log_layout.addWidget(btn_clear)
        
        log_group.setLayout(log_layout)
        layout.addWidget(log_group)
        
        # Auto-refresh
        self.timer = QTimer()
        self.timer.timeout.connect(self.refresh_logs)
        self.timer.start(2000)  # Refresh every 2 seconds
        
        self.setLayout(layout)
    
    def refresh_logs(self):
        """Refresh audit trail from files"""
        try:
            audit_file = Path(self.project_root) / 'logs' / 'audit-trail.json'
            
            if audit_file.exists():
                with open(audit_file) as f:
                    data = json.load(f)
                
                # Show last 20 entries
                entries = data.get('entries', [])[-20:]
                
                if self.log_list.count() < len(entries):
                    for entry in entries[self.log_list.count():]:
                        item = QListWidget().takeItem(0)
                        msg = f"[{entry.get('timestamp', '?')}] {entry.get('action', '?')}"
                        
                        widget_item = QListWidgetItem(msg)
                        # Color code
                        if 'ERROR' in entry.get('action', ''):
                            widget_item.setForeground(QColor('red'))
                        elif 'SUCCESS' in entry.get('action', ''):
                            widget_item.setForeground(QColor('green'))
                        
                        self.log_list.addItem(widget_item)
                    
                    self.log_list.scrollToBottom()
                
                self.status_label.setText("🟢 Online")
        except:
            if self.status_label.text() != "🔴 Offline":
                self.status_label.setText("🔴 Offline")


class POIDHGui(QMainWindow):
    """Main application window"""
    
    def __init__(self, project_root: str):
        super().__init__()
        self.project_root = project_root
        self.init_ui()
    
    def init_ui(self):
        self.setWindowTitle("POIDH Autonomous Bounty Bot - Control Panel")
        self.setGeometry(100, 100, 1000, 800)
        
        # Create tabs
        tabs = QTabWidget()
        
        self.wallet_tab = WalletTab(self.project_root)
        self.config_tab = ConfigTab(self.project_root)
        self.bounty_tab = BountyTab(self.project_root)
        self.monitor_tab = MonitorTab(self.project_root)
        
        tabs.addTab(self.wallet_tab, "🔐 Wallet")
        tabs.addTab(self.config_tab, "⚙️ Configuration")
        tabs.addTab(self.bounty_tab, "🎯 Create Bounty")
        tabs.addTab(self.monitor_tab, "📊 Monitor")
        
        # Central widget
        central = QWidget()
        layout = QVBoxLayout()
        layout.addWidget(tabs)
        central.setLayout(layout)
        self.setCentralWidget(central)
        
        # Status bar
        self.statusBar().showMessage("Ready")


def main():
    # Find project root
    project_root = Path(__file__).parent.parent
    
    app = QApplication(sys.argv)
    window = POIDHGui(str(project_root))
    window.show()
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
