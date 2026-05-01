#pragma once
#include <SFML/Graphics.hpp>
#include <vector>
#include <string>
#include <functional>

class Menu {
public:
    Menu() : visible(false), hoveredIndex(-1) {
        font.loadFromFile("C:/Windows/Fonts/arial.ttf");
    }

    void addButton(const std::string& text, std::function<void()> action) {
        buttons.push_back({ text, action });
    }

    void toggle() { visible = !visible; }
    bool isVisible() const { return visible; }
    void hide() { visible = false; }

    // Обновляем индекс при наведении мыши
    void updateMouseHover(const sf::RenderWindow& window) {
        if (!visible) return;

        sf::Vector2i mousePos = sf::Mouse::getPosition(window);
        hoveredIndex = -1;

        for (int i = 0; i < buttonTexts.size(); ++i) {
            if (buttonTexts[i].getGlobalBounds().contains(mousePos.x, mousePos.y)) {
                hoveredIndex = static_cast<int>(i);
                break;
            }
        }
    }

    void handleInput(const sf::Event& event, const sf::RenderWindow& window) {
        if (!visible) return;

        // Клик мышкой
        if (event.type == sf::Event::MouseButtonPressed && event.mouseButton.button == sf::Mouse::Left) {
            sf::Vector2i mousePos = sf::Mouse::getPosition(window);
            for (int i = 0; i < buttonTexts.size(); ++i) {
                if (buttonTexts[i].getGlobalBounds().contains(mousePos.x, mousePos.y)) {
                    buttons[i].action();
                    break;
                }
            }
        }
    }

    void draw(sf::RenderWindow& window) {
        if (!visible) return;

        // Затемнение фона
        sf::RectangleShape overlay(sf::Vector2f(window.getSize().x, window.getSize().y));
        overlay.setFillColor(sf::Color(0, 0, 0, 150));
        window.draw(overlay);

        // Заголовок
        sf::Text title("PAUSE", font, 40);
        title.setFillColor(sf::Color::White);
        title.setPosition(window.getSize().x / 2 - 60, 200);
        window.draw(title);

        // Кнопки
        float startY = 300;
        float spacing = 50;
        for (int i = 0; i < buttons.size(); ++i) {
            buttonTexts[i].setPosition(window.getSize().x / 2 - 100, startY + i * spacing);

            // Подсветка при наведении
            if (i == hoveredIndex) {
                buttonTexts[i].setFillColor(sf::Color(255, 200, 0));  // Оранжево-жёлтый
                buttonTexts[i].setCharacterSize(28);
                buttonTexts[i].setOutlineThickness(1.5f);
                buttonTexts[i].setOutlineColor(sf::Color(255, 200, 0));
            }
            else {
                buttonTexts[i].setFillColor(sf::Color::White);
                buttonTexts[i].setCharacterSize(24);
                buttonTexts[i].setOutlineThickness(0.f);
            }
            window.draw(buttonTexts[i]);
        }
    }

    void updateTexts() {
        buttonTexts.clear();
        for (const auto& btn : buttons) {
            sf::Text text(btn.label, font, 24);
            text.setOutlineColor(sf::Color::Black);
            text.setOutlineThickness(2.f);
            buttonTexts.push_back(text);
        }
    }

    // === ДОБАВИТЬ В ПУБЛИЧНУЮ ЧАСТЬ КЛАССА ===
    void drawStats(sf::RenderWindow& window, float playTime, int slimes, int bosses) {
        if (!visible) return;

        // Позиция справа от кнопок
        float statsX = window.getSize().x / 2 + 150;
        float statsY = 300;

        // Заголовок
        sf::Text statsTitle("STATISTICS", font, 24);
        statsTitle.setFillColor(sf::Color(255, 200, 0));
        statsTitle.setPosition(statsX, statsY - 40);
        window.draw(statsTitle);

        // Время игры
        int minutes = static_cast<int>(playTime) / 60;
        int seconds = static_cast<int>(playTime) % 60;
        std::string timeStr = "Time: " + std::to_string(minutes) + "m " +
            (seconds < 10 ? "0" : "") + std::to_string(seconds) + "s";
        sf::Text timeText(timeStr, font, 20);
        timeText.setFillColor(sf::Color::White);
        timeText.setPosition(statsX, statsY);
        window.draw(timeText);

        // Слизни
        std::string slimeStr = "Slimes: " + std::to_string(slimes);
        sf::Text slimeText(slimeStr, font, 20);
        slimeText.setFillColor(sf::Color::White);
        slimeText.setPosition(statsX, statsY + 30);
        window.draw(slimeText);

        // Боссы
        std::string bossStr = "Bosses: " + std::to_string(bosses);
        sf::Text bossText(bossStr, font, 20);
        bossText.setFillColor(sf::Color(255, 100, 100));
        bossText.setPosition(statsX, statsY + 60);
        window.draw(bossText);
    }


private:
    struct Button {
        std::string label;
        std::function<void()> action;
    };

    bool visible;
    int hoveredIndex;  // Только индекс кнопки под мышкой
    sf::Font font;
    std::vector<Button> buttons;
    std::vector<sf::Text> buttonTexts;
};
