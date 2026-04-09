#pragma once
#include <SFML/Graphics.hpp>
#include <vector>

class Portal {
public:
    // Конструктор: создаем портал в точке x, y
    Portal(float x, float y);
    //сброс триггера
    void resetTrigger() { triggered = false; }

    // Обновление: отвечает за анимацию
    void update(float deltaTime);

    // Отрисовка: рисуем портал на экране
    void draw(sf::RenderWindow& window);

    // Проверка: коснулся ли герой портала?
    bool isPlayerInside(sf::FloatRect playerBounds);

    // Флаг: сработал ли портал
    bool triggered = false;

private:
    std::vector<sf::Texture> textures;
    sf::Sprite sprite;
    int currentFrame = 0;
    float frameTimer = 0;
    float animationSpeed = 0.1f; // Скорость анимации (чем меньше, тем быстрее)
};
