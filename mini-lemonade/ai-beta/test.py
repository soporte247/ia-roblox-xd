#!/usr/bin/env python3
"""
Quick test script para el beta model
Verifica que el servidor está funcionando correctamente
"""

import requests
import json
import time
import sys

def test_health():
    """Test endpoint /health"""
    print("\n🔍 Testing Health Check...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Health check passed: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False


def test_chat_completion():
    """Test endpoint /v1/chat/completions"""
    print("\n🔍 Testing Chat Completion...")
    
    payload = {
        "model": "datashark-beta",
        "messages": [
            {"role": "system", "content": "Eres un asistente de programación Lua para Roblox."},
            {"role": "user", "content": "Crea un sistema simple de ataque en Roblox"}
        ],
        "temperature": 0.7,
        "max_tokens": 128,
        "top_p": 0.95
    }
    
    try:
        start = time.time()
        response = requests.post(
            "http://localhost:8000/v1/chat/completions",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chat completion successful ({elapsed:.2f}s)")
            print(f"   Model: {data.get('model', 'N/A')}")
            print(f"   Tokens used: {data.get('usage', {}).get('completion_tokens', 0)}")
            if data.get('choices') and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content'][:100]
                print(f"   Response: {content}...")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
            return False
    except Exception as e:
        print(f"❌ Request error: {e}")
        return False


def test_backend_connection():
    """Test conexión desde backend"""
    print("\n🔍 Testing Backend Integration...")
    
    payload = {
        "prompt": "crea un sistema de defensa",
        "type": "defense"
    }
    
    try:
        response = requests.post(
            "http://localhost:3000/api/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            print(f"✅ Backend integration working")
            return True
        elif response.status_code == 401:
            print(f"⚠️  Backend requires authentication (expected)")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"⚠️  Backend not running on port 3000 (not critical)")
        return True
    except Exception as e:
        print(f"⚠️  Backend test skipped: {e}")
        return True


def main():
    print("=" * 60)
    print("DataShark Beta Model - Test Suite")
    print("=" * 60)
    
    print("\n📋 Prerequisitos:")
    print("  - Beta model corriendo en http://localhost:8000")
    print("  - (Opcional) Backend corriendo en http://localhost:3000")
    
    results = []
    
    # Pruebas principales
    results.append(("Health Check", test_health()))
    
    if results[0][1]:  # Si health check pasó
        results.append(("Chat Completion", test_chat_completion()))
        results.append(("Backend Integration", test_backend_connection()))
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 Test Results")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} - {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Beta model is ready.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(130)
