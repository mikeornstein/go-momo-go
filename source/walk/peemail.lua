-- Pee-mail marks. Sniff to read; messages are the walk's radar.

local gfx <const> = playdate.graphics

local YARDS_BOTTOM <const> = 96
local SIDEWALK_BOTTOM <const> = 192
local BANNER_FRAMES <const> = 90
local RANGE_Y <const> = 28

local WALK1 <const> = {
    {x = 300, w = 40, text = "BRUNO WAS HERE", prop = "hydrant"},
    {x = 760, w = 32, text = "DO NOT SNIFF THE GNOME LAWN", prop = "tree"},
}

Peemail = {}
Peemail.__index = Peemail
Peemail.BANNER_FRAMES = BANNER_FRAMES

function Peemail.walk1()
    local self = setmetatable({}, Peemail)
    self.spots = {}
    for i = 1, #WALK1 do
        local s = WALK1[i]
        self.spots[i] = {
            x = s.x,
            w = s.w,
            text = s.text,
            prop = s.prop,
            read = false,
        }
    end
    self.banner = nil
    self.bannerFrames = 0
    return self
end

function Peemail:reset()
    for i = 1, #self.spots do
        self.spots[i].read = false
    end
    self.banner = nil
    self.bannerFrames = 0
end

function Peemail:at(worldX, worldY)
    if worldY < YARDS_BOTTOM - RANGE_Y or worldY > SIDEWALK_BOTTOM + 8 then
        return nil
    end
    for i = 1, #self.spots do
        local s = self.spots[i]
        if worldX >= s.x and worldX <= s.x + s.w then
            return s
        end
    end
    return nil
end

function Peemail:nearestUnread(fromX, walkerX, maxDist)
    local best, bestD = nil, maxDist + 1
    for i = 1, #self.spots do
        local s = self.spots[i]
        if (not s.read) and s.x + s.w >= walkerX then
            local cx = s.x + s.w / 2
            local d = math.abs(cx - fromX)
            if d < bestD then
                bestD = d
                best = s
            end
        end
    end
    if not best then
        return nil
    end
    return best.x + best.w / 2, SIDEWALK_BOTTOM, best
end

function Peemail:show(text)
    self.banner = text
    self.bannerFrames = BANNER_FRAMES
end

function Peemail:update()
    if self.bannerFrames > 0 then
        self.bannerFrames -= 1
        if self.bannerFrames == 0 then
            self.banner = nil
        end
    end
end

function Peemail:draw(cameraX, screenW)
    for i = 1, #self.spots do
        local s = self.spots[i]
        local x = s.x - cameraX
        if x < screenW and x + s.w > 0 then
            local cx = x + s.w / 2
            if s.prop == "tree" then
                Peemail.drawTree(cx, YARDS_BOTTOM)
            end
            if not s.read then
                gfx.setColor(gfx.kColorBlack)
                gfx.fillEllipseInRect(cx - 8, SIDEWALK_BOTTOM - 5, 16, 6)
            end
        end
    end
end

function Peemail.drawTree(x, groundY)
    gfx.setColor(gfx.kColorBlack)
    gfx.fillRect(x - 4, groundY - 36, 8, 36)
    gfx.fillCircleAtPoint(x, groundY - 48, 18)
    gfx.setColor(gfx.kColorWhite)
    gfx.drawCircleAtPoint(x, groundY - 48, 18)
end
