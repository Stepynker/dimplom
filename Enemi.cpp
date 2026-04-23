#include "Enemy.h"
#include <cstdlib>
#include <ctime>
#include <iostream>
#include <cmath>

sf::Texture Enemy::texIdle;
sf::Texture Enemy::texJump;
bool Enemy::texturesLoaded = false;

Enemy::Enemy(float x, float y, float speed)
    : position(x, y), originalPos(x, y), moveSpeed(speed),
    currentFrame(0),           // Инициализация
    animationTimer(0.f),       // Инициализация
    animationSpeed(0.6f) {     // Инициализация

    if (!texturesLoaded) {
        if (texIdle.loadFromFile("slime_idle.png") && texJump.loadFromFile("slime_jump.png")) {
            texIdle.setSmooth(false);
            texJump.setSmooth(false);
            texturesLoaded = true;
            std::cout << "Enemy textures loaded!" << std::endl;
        }
        else {
            std::cout << "ERROR: Could not load slime textures!" << std::endl;
        }
    }

    sprite.setTexture(texIdle);
    sprite.setPosition(position);
    sprite.setScale(1.0f, 1.0f);

    // HP
    maxHP = 50;
    currentHP = maxHP;

    // Респавн
    isDeadFlag = false;
    respawnTimer = 0.f;
    respawnDelay = 10.f;  // 10 секунд
    animationSpeed = 0.6f;  // Медленнее анимация
}

void Enemy::update(float deltaTime, const sf::Vector2f& playerPos) {
    // Если мёртв — только считаем таймер респавна
    if (isDeadFlag) {
        respawnTimer += deltaTime;
        if (respawnTimer >= respawnDelay) {
            // Респавн!
            position = originalPos;
            currentHP = maxHP;
            isDeadFlag = false;
            respawnTimer = 0.f;
            sprite.setPosition(position);
            std::cout << "Enemy respawned!" << std::endl;
        }
        return;  // Выход, не двигаемся и не анимируемся
    }

    // Живой враг — обычная логика
    sf::Vector2f direction = playerPos - position;
    float length = std::sqrt(direction.x * direction.x + direction.y * direction.y);

    if (length > 5.f) {
        direction /= length;
        position += direction * moveSpeed * deltaTime;
        sprite.setPosition(position);

        // Анимация
        animationTimer += deltaTime;
        if (animationTimer >= animationSpeed) {
            currentFrame = (currentFrame + 1) % 2;
            if (currentFrame == 0) sprite.setTexture(texIdle);
            else sprite.setTexture(texJump);
            animationTimer = 0.f;
        }
    }
    else {
        sprite.setTexture(texIdle);
        currentFrame = 0;
        animationTimer = 0.f;
    }
}

void Enemy::draw(sf::RenderWindow& window) {
    // Не рисуем если мёртв
    if (!isDeadFlag) {
        window.draw(sprite);
    }
}

sf::FloatRect Enemy::getBounds() const {
    return sprite.getGlobalBounds();
}

sf::Vector2f Enemy::getPosition() const {
    return position;
}

bool Enemy::takeDamage(int damage) {
    if (isDeadFlag) return false;  // Уже мёртв

    currentHP -= damage;
    std::cout << "Enemy took " << damage << " damage! HP: "
        << currentHP << "/" << maxHP << std::endl;

    if (currentHP <= 0) {
        isDeadFlag = true;
        std::cout << "Enemy died! Respawning in " << respawnDelay << "s..." << std::endl;
        return true;
    }
    return false;
}

void Enemy::respawn(float x, float y) {
    originalPos = sf::Vector2f(x, y);
    position = originalPos;
    currentHP = maxHP;
    isDeadFlag = false;
    respawnTimer = 0.f;
    sprite.setPosition(position);
}

// === EnemyManager ===
void EnemyManager::spawnRandomEnemies(int count, float enemySpeed) {
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    enemies.clear();

    for (int i = 0; i < count; ++i) {
        float x = 100.f + static_cast<float>(std::rand() % 824);
        float y = 100.f + static_cast<float>(std::rand() % 824);
        enemies.emplace_back(x, y, enemySpeed);
    }
}

void EnemyManager::updateAll(float deltaTime, const sf::Vector2f& playerPos) {
    for (auto& enemy : enemies) {
        enemy.update(deltaTime, playerPos);
    }
}

void EnemyManager::drawAll(sf::RenderWindow& window) {
    for (auto& enemy : enemies) {
        enemy.draw(window);
    }
}
